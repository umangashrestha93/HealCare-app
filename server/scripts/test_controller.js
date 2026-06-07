require('dotenv').config();
const mongoose = require('mongoose');
const Practitioner = require('../models/Practitioner');
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const test = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const practitionerId = '6a24ff8a9161f4f0212503d3';
    let practitionerEmail = '';

    if (isObjectId(practitionerId)) {
      // Run the query WITHOUT importing User model first
      const practitioner = await Practitioner.findById(practitionerId)
        .populate('userId', 'firstName lastName email')
        .lean();

      if (practitioner) {
        practitionerEmail = practitioner.userId?.email || '';
        console.log('Practitioner found:', practitioner);
        console.log('Practitioner email:', practitionerEmail);
      } else {
        console.log('Practitioner not found!');
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

test();
