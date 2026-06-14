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
  
  const users = await User.find({}).lean();
  console.log('Found users:', users.map(u => ({
    id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    sex: u.sex,
    age: u.age,
    role: u.role
  })));
  
  await mongoose.disconnect();
};

run().catch(console.error);
