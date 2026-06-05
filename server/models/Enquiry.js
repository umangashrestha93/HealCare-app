const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Practitioner',
    index: true
  },
  practitionerExternalId: {
    type: String,
    index: true
  },
  practitionerName: {
    type: String,
    required: true,
    trim: true
  },
  practitionerDiscipline: {
    type: String,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  fundingOptions: [{ type: String }],
  preferredPostcode: { type: String, trim: true },
  status: {
    type: String,
    enum: ['new', 'contacted', 'closed'],
    default: 'new',
    index: true
  },
  source: {
    type: String,
    default: 'marketplace'
  }
}, { timestamps: true });

EnquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Enquiry', EnquirySchema);
