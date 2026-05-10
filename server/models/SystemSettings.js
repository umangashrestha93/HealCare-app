const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'platform',
    unique: true,
    index: true
  },
  platform: {
    appName: { type: String, default: 'Beyond5 Healthcare' },
    supportEmail: { type: String, default: 'support@beyond5.com' }
  },
  bookingRules: {
    cancellationPolicyHours: { type: Number, default: 24 },
    maxBookingsPerDay: { type: Number, default: 8 }
  },
  featureToggles: {
    aiAssistant: { type: Boolean, default: true },
    practitionerChat: { type: Boolean, default: true },
    marketplaceBookings: { type: Boolean, default: true },
    reviews: { type: Boolean, default: true }
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
