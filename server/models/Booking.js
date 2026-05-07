const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  practitionerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true },
  
  appointmentDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // Format: "HH:mm"
  endTime: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['confirmed', 'cancelled', 'completed', 'pending'], 
    default: 'confirmed' 
  },
  
  serviceType: { type: String, enum: ['telehealth', 'in-person'], required: true },
  notes: { type: String },
  
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  
  createdAt: { type: Date, default: Date.now }
});

// Index to prevent double booking at the same time for same practitioner
BookingSchema.index({ practitionerId: 1, appointmentDate: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Booking', BookingSchema);
