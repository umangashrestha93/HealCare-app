const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  practitionerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Practitioner',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update practitioner average rating after a review is saved
ReviewSchema.post('save', async function() {
  const Practitioner = mongoose.model('Practitioner');
  const reviews = await this.constructor.find({ practitionerId: this.practitionerId });
  
  const totalReviews = reviews.length;
  const averageRating = reviews.reduce((acc, item) => item.rating + acc, 0) / totalReviews;
  
  await Practitioner.findByIdAndUpdate(this.practitionerId, {
    averageRating: averageRating.toFixed(1),
    totalReviews
  });
});

module.exports = mongoose.model('Review', ReviewSchema);
