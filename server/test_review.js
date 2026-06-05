const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({ role: 'client' }).limit(3);
    for (const u of users) {
      console.log(`Client Email: ${u.email}, Name: ${u.firstName} ${u.lastName}`);
    }
    const practitioners = await User.find({ role: 'practitioner' }).limit(3);
    for (const p of practitioners) {
      console.log(`Practitioner Email: ${p.email}, Name: ${p.firstName} ${p.lastName}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

test();
