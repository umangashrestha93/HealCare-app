const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');
const mongoose = require('mongoose');

// Helper: recalculate and persist practitioner rating after a review change
const recalculatePractitionerRating = async (practitionerId) => {
  const reviews = await Review.find({ practitionerId });
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;
  await Practitioner.findByIdAndUpdate(practitionerId, {
    averageRating: Number(averageRating.toFixed(1)),
    totalReviews
  });
};

// @desc    Create or update a review for a booking
// @route   POST /api/reviews
// @access  Private (Client only)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const clientId = req.user._id;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, error: 'bookingId and rating are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ success: false, error: 'Invalid bookingId' });
    }

    // Check if booking exists and belongs to this client
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to review this booking' });
    }

    const practitionerId = booking.practitionerId;
    const isNew = !(await Review.findOne({ bookingId }));

    // Upsert: create if first review, update if editing an existing one
    const review = await Review.findOneAndUpdate(
      { bookingId },
      { $set: { clientId, practitionerId, rating, comment, updatedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Manually trigger rating recalculation (since findOneAndUpdate skips post-save hooks)
    await recalculatePractitionerRating(practitionerId);

    const statusCode = isNew ? 201 : 200;
    const message = isNew ? 'Review submitted successfully' : 'Review updated successfully';

    res.status(statusCode).json({ success: true, message, data: review });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get reviews for a practitioner
// @route   GET /api/reviews/practitioner/:practitionerId
// @access  Public
exports.getPractitionerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ practitionerId: req.params.practitionerId })
      .populate('clientId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
