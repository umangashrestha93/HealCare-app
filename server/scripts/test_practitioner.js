require('dotenv').config();
const mongoose = require('mongoose');
const Practitioner = require('../models/Practitioner');
const User = require('../models/User');

const test = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const practitionerId = '6a24ff8a9161f4f0212503d3';
    const practitioner = await Practitioner.findById(practitionerId)
      .populate('userId', 'firstName lastName email')
      .lean();

    console.log('Practitioner fetched:', JSON.stringify(practitioner, null, 2));
    
    if (practitioner) {
      console.log('userId type:', typeof practitioner.userId);
      console.log('userId email:', practitioner.userId?.email);
    } else {
      console.log('Practitioner not found in database!');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

test();
