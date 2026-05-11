const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect to database when available. Local auth still works with in-memory
// storage if MongoDB is not running.
connectDB();

const app = express();

// Middleware
const normalizeOrigin = (origin) => origin?.replace(/\/+$/, '');

const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  ...configuredOrigins
]);

const isLocalDevOrigin = (origin) => (
  process.env.NODE_ENV !== 'production'
  && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(origin)
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin) || isLocalDevOrigin(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Route Files
const authRoutes = require('./routes/authRoutes');
const practitionerRoutes = require('./routes/practitionerRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Mount Routers
app.use('/api/auth', authRoutes);
app.use('/api/practitioners', practitionerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', aiRoutes);


// Root Endpoint (Lightweight / Mobile-First)
app.get('/', (req, res) => {
  res.status(200).json({ 
    app: 'Beyond5 Healthcare API', 
    version: '1.0.0',
    status: 'Healthy'
  });
});

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`Beyond5 Server running in ${process.env.NODE_ENV || 'development'} mode at http://${HOST}:${PORT}`);
});

const { initializeSocket } = require('./socketHandler');
initializeSocket(server, corsOptions, app);

server.on('error', (err) => {
  console.error(`Server failed to start: ${err.message}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
