const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['new_message', 'booking_accepted', 'booking_cancelled', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId, // Could be messageId or bookingId
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    enum: ['Message', 'Booking']
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
