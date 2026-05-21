const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true, index: true },
  provider: {
    type: String,
    enum: ['demo', 'paypal', 'stripe', 'manual'],
    default: 'demo'
  },
  method: {
    type: String,
    enum: ['card', 'paypal'],
    required: true
  },
  currency: { type: String, default: 'AUD' },
  amountCents: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
    index: true
  },
  providerSessionId: { type: String, index: true },
  providerOrderId: { type: String },
  receiptNumber: { type: String },
  checkoutUrl: { type: String },
  paidAt: { type: Date },
  failureReason: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

PaymentSchema.index({ clientId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
