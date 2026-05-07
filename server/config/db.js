const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/beyond5')
      .replace('mongodb://localhost', 'mongodb://127.0.0.1');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (err) {
    console.warn(`MongoDB not connected: ${err.message}`);
    console.warn('Auth will use in-memory storage for this dev session.');
    return false;
  }
};

module.exports = connectDB;
