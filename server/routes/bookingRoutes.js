const express = require('express');
const { createBooking, getMyBookings } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router
  .route('/')
  .get(getMyBookings)
  .post(authorize('client'), createBooking);

module.exports = router;
