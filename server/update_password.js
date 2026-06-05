const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const email = 'umangashrestha93@gmail.com';
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash('password123', salt);
    await user.save();
    console.log('Password updated successfully for', email);
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
