const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  adminRole: {
    type: String,
    enum: ['super-admin', 'support-admin', 'moderator'],
    default: 'support-admin',
    index: true
  },
  permissions: [{
    type: String,
    enum: [
      'users:read',
      'users:write',
      'practitioners:read',
      'practitioners:verify',
      'admins:manage',
      'settings:manage',
      'logs:read'
    ]
  }],
  disabled: { type: Boolean, default: false, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
