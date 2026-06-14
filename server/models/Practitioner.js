const mongoose = require('mongoose');

const PractitionerSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  discipline: { type: String, required: true },
  specializations: [{ type: String }],
  bio: { type: String },
  yearsExp: { type: Number },
  abn: { type: String },
  gender: { type: String, default: 'Not specified' },
  location: { type: String, index: true }, // Denormalized for fast filtering
  postcode: { type: String, index: true },
  travelArea: { type: String },
  travelsToPostcodes: [{ type: String, index: true }],
  mobile: { type: Boolean, default: false },
  fundingOptions: [{
    type: String,
    enum: ['NDIS', 'Medicare', 'My Aged Care', 'Private Health Fund', 'Veterans’ Affairs']
  }],
  sploseStatus: {
    type: String,
    default: 'Splose calendar pending integration'
  },
  avatar: { type: String, default: '' },
  photos: { type: [String], default: [] },
  fee: { type: Number, default: 80 }, // Consultation fee in AUD
  
  // Verification System
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    index: true,
    default: 'pending' 
  },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  
  // Compliance Documents
  complianceDocs: [{
    docType: { type: String, required: true },
    url: { type: String, default: 'pending-upload' },
    originalName: { type: String },
    mimeType: { type: String },
    size: { type: Number },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    expiryDate: { type: Date },
    uploadedAt: { type: Date, default: Date.now }
  }],
  complianceNotes: [{
    note: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Availability Flags
  telehealth: { type: Boolean, default: false },
  afterHours: { type: Boolean, default: false },
  weekends: { type: Boolean, default: false },

  // Bookable Time Slots (configurable per practitioner)
  // e.g. ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"]
  availableSlots: {
    type: [String],
    default: ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM']
  },
  
  // Performance Metrics
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  utilizationRate: { type: Number, default: 0 }, // Utilization Data
  
  // myGigster Integration
  myGigster: {
    isSetup: { type: Boolean, default: false },
    accountId: { type: String, default: '' },
    taxReservePercentage: { type: Number, default: 20, min: 0, max: 100 },
    bankDetails: {
      bankName: { type: String, default: '' },
      bsb: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      accountHolder: { type: String, default: '' }
    },
    expenses: [{
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      category: { type: String, default: 'Other' }, // e.g. 'Mileage', 'Equipment', 'Software', 'Travel', 'Other'
      mileageKm: { type: Number, default: 0 }
    }],
    payoutHistory: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      status: { type: String, default: 'Completed' },
      reference: { type: String }
    }]
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PractitionerSchema.index({ verificationStatus: 1, createdAt: -1 });
PractitionerSchema.index({ isVerified: 1, createdAt: -1 });

PractitionerSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Virtual for Trust Signal
PractitionerSchema.virtual('status').get(function() {
  return this.isVerified ? 'Verified' : 'Pending';
});

module.exports = mongoose.model('Practitioner', PractitionerSchema);
