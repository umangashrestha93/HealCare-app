const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['client', 'practitioner', 'admin'], 
    default: 'client' 
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active',
    index: true
  },
  deletedAt: { type: Date, default: null, index: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  avatar: { type: String, default: '' },
  location: { type: String },
  phone: { type: String },
  sex: { type: String, enum: ['Male', 'Female', ''], default: '' },
  age: { type: Number, min: 0, max: 120, default: null },
  medicareCard: {
    status: {
      type: String,
      enum: ['not_submitted', 'verified', 'expired', 'rejected'],
      default: 'not_submitted'
    },
    holderName: { type: String, trim: true },
    numberLast4: { type: String },
    numberHash: { type: String, select: false },
    referenceNumber: { type: String },
    expiryMonth: { type: Number, min: 1, max: 12 },
    expiryYear: { type: Number },
    offerCode: { type: String },
    offerPercent: { type: Number, default: 0 },
    verifiedAt: { type: Date },
    updatedAt: { type: Date }
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ role: 1, status: 1, deletedAt: 1 });

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
