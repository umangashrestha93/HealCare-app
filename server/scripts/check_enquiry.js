require('dotenv').config();
const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');

const test = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const enquiryId = '6a2502130f699e75e84ec4a2';
    const enquiry = await Enquiry.findById(enquiryId).lean();

    console.log('Enquiry fetched:', JSON.stringify(enquiry, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

test();
