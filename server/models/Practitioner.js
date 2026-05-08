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
  
  // Verification System
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  isVerified: { type: Boolean, default: false },
  
  // Compliance Documents
  complianceDocs: [{
    docType: { type: String, required: true },
    url: { type: String, default: 'pending-upload' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    expiryDate: { type: Date },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Availability Flags
  telehealth: { type: Boolean, default: false },
  afterHours: { type: Boolean, default: false },
  weekends: { type: Boolean, default: false },
  
  // Performance Metrics
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  utilizationRate: { type: Number, default: 0 }, // Utilization Data
  
  createdAt: { type: Date, default: Date.now }
});

// Virtual for Trust Signal
PractitionerSchema.virtual('status').get(function() {
  return this.isVerified ? 'Verified' : 'Pending';
});

module.exports = mongoose.model('Practitioner', PractitionerSchema);
