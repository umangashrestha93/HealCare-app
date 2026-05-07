const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const email = (process.env.ADMIN_EMAIL || 'admin@beyond5.com.au').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

const run = async () => {
  const mongoUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/beyond5')
    .replace('mongodb://localhost', 'mongodb://127.0.0.1');

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });

  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    existingAdmin.role = 'admin';
    existingAdmin.password = password;
    await existingAdmin.save();
    console.log(`Updated admin user: ${email}`);
  } else {
    await User.create({
      firstName: 'Beyond5',
      lastName: 'Admin',
      email,
      password,
      role: 'admin'
    });
    console.log(`Created admin user: ${email}`);
  }

  console.log(`Temporary admin password: ${password}`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(`Admin seed failed: ${err.message}`);
  await mongoose.disconnect();
  process.exit(1);
});
