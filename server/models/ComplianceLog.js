const mongoose = require('mongoose');

const ComplianceLogSchema = new mongoose.Schema({
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Practitioner',
    required: true,
    index: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['approved', 'rejected', 'status-updated', 'note-added'],
    required: true,
    index: true
  },
  fromStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  toStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null
  },
  note: { type: String, trim: true },
  documentType: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

ComplianceLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ComplianceLog', ComplianceLogSchema);
