const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../models/User');

const run = async () => {
  const mongoUri = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/beyond5')
    .replace('mongodb://localhost', 'mongodb://127.0.0.1');
  console.log('Connecting to', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected!');

  // Find a user (e.g., umangashrestha93@gmail.com)
  const email = 'umangashrestha93@gmail.com';
  let user = await User.findOne({ email });
  if (!user) {
    console.log(`User ${email} not found`);
    await mongoose.disconnect();
    return;
  }

  console.log('Original User:', { id: user._id, email: user.email, age: user.age, sex: user.sex });

  // Update age
  user.age = 28;
  await user.save();
  console.log('Saved user age to 28');

  // Fetch again
  user = await User.findOne({ email }).lean();
  console.log('Fetched User after save:', { id: user._id, email: user.email, age: user.age, sex: user.sex });

  // Update using findByIdAndUpdate
  await User.findByIdAndUpdate(user._id, { age: 32 });
  console.log('Updated user age using findByIdAndUpdate to 32');

  user = await User.findOne({ email }).lean();
  console.log('Fetched User after findByIdAndUpdate:', { id: user._id, email: user.email, age: user.age, sex: user.sex });

  await mongoose.disconnect();
};

run().catch(console.error);
