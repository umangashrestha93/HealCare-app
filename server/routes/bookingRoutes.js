const express = require('express');
const {
  createBooking,
  getMyBookings,
  cancelBooking,
  getAvailableSlots,
  getTelehealthRoom
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Public: check available slots before booking
router.get('/availability', getAvailableSlots);

// Protected routes
router.use(protect);
router
  .route('/')
  .get(getMyBookings)
  .post(authorize('client'), createBooking);

router.get('/telehealth/:roomId', getTelehealthRoom);

router
  .route('/:id')
  .delete(authorize('client'), cancelBooking);

module.exports = router;
