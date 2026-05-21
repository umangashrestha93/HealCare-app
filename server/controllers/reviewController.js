const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Create a review for a booking
// @route   POST /api/reviews
// @access  Private (Client only)
exports.createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const clientId = req.user._id;

    // Check if booking exists and belongs to client
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.clientId.toString() !== clientId.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to review this booking' });
    }

    // Check if booking is completed
    // Note: In a real app, you'd check if booking status is 'completed'
    // For now, we'll allow reviewing any booking the client has.

    // Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, error: 'Review already exists for this booking' });
    }

    const review = await Review.create({
      bookingId,
      clientId,
      practitionerId: booking.practitionerId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
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

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
