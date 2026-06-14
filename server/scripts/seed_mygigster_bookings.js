const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');
const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');

const run = async () => {
  const mongoUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/beyond5')
    .replace('mongodb://localhost', 'mongodb://127.0.0.1');
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  // Find or create a mock client
  let clientUser = await User.findOne({ role: 'client' });
  if (!clientUser) {
    console.log('No client user found. Creating a mock client...');
    clientUser = await User.create({
      firstName: 'Emily',
      lastName: 'Smith',
      email: 'emily.smith@example.com',
      password: '$2b$10$yXfXhN7Z8eA3q7F9b2dOfe1A.d1S8zG5p9C4eP7xS1vC9D1rQe5eG', // mock hash
      role: 'client'
    });
    console.log('Mock client created:', clientUser.email);
  }

  // Find all practitioners
  const practitioners = await Practitioner.find({});
  console.log(`Found ${practitioners.length} practitioners.`);

  if (practitioners.length === 0) {
    console.log('No practitioners found in the database. Please register a practitioner first.');
  }

  for (const practitioner of practitioners) {
    console.log(`Seeding bookings for practitioner: ${practitioner._id}`);

    // Check if bookings already exist for this practitioner
    const existingBookings = await Booking.find({ practitionerId: practitioner._id, paymentStatus: 'paid' });
    if (existingBookings.length >= 2) {
      console.log(`Practitioner already has ${existingBookings.length} paid bookings. Skipping seeding.`);
      continue;
    }

    // Seed 2 completed and paid bookings
    const bookingsData = [
      {
        clientId: clientUser._id,
        practitionerId: practitioner._id,
        appointmentDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        status: 'completed',
        serviceType: 'in-person',
        notes: 'Initial therapeutic consultation session.',
        pricing: {
          currency: 'AUD',
          subtotal: 150,
          total: 150
        },
        paymentStatus: 'paid',
        payment: {
          provider: 'demo',
          paidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`
        }
      },
      {
        clientId: clientUser._id,
        practitionerId: practitioner._id,
        appointmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        startTime: '02:00 PM',
        endTime: '03:00 PM',
        status: 'completed',
        serviceType: 'telehealth',
        notes: 'Follow-up consultation.',
        pricing: {
          currency: 'AUD',
          subtotal: 150,
          total: 150
        },
        paymentStatus: 'paid',
        payment: {
          provider: 'demo',
          paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          receiptNumber: `REC-${Math.floor(100000 + Math.random() * 900000)}`
        }
      }
    ];

    for (const bData of bookingsData) {
      try {
        await Booking.create(bData);
        console.log('Created booking successfully!');
      } catch (err) {
        console.error('Error creating booking:', err.message);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Database seeded successfully and disconnected!');
};

run().catch(console.error);
