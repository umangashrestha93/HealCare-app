const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true },
  
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled', 'completed', 'pending', 'pending_approval'], 
    default: 'confirmed' 
  },
  
  serviceType: { type: String, enum: ['telehealth', 'in-person'], required: true },
  notes: { type: String },
  cancellationReason: { type: String, default: 'requested_by_customer' },
  cancelReason: { type: String, default: 'requested_by_customer' },
  refundReason: { type: String, default: 'requested_by_customer' },
  reason: { type: String, default: 'requested_by_customer' },
  
  pricing: {
    currency: { type: String, default: 'AUD' },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    medicareOfferApplied: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    offerCode: { type: String }
  },

  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed', 'refunded'],
    default: 'unpaid'
  },
  paymentExpiresAt: { type: Date },
  paymentMethod: { type: String, enum: ['card', 'paypal'], default: 'card' },
  payment: {
    provider: { type: String, enum: ['demo', 'paypal', 'stripe', 'manual'], default: 'demo' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    providerSessionId: { type: String },
    receiptNumber: { type: String },
    paidAt: { type: Date }
  },

  telehealthRoom: {
    provider: { type: String, enum: ['inbuilt', 'google-meet'], default: 'inbuilt' },
    roomId: { type: String, index: true },
    joinUrl: { type: String },
    createdAt: { type: Date }
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index to prevent double booking at the same time for same practitioner.
// Cancelled/completed bookings are intentionally excluded so a freed slot can be booked again.
BookingSchema.index(
  { practitionerId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'pending_approval'] } }
  }
);

BookingSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Booking', BookingSchema);
