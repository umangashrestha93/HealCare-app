const express = require('express');
const { createBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.route('/').post(authorize('client'), createBooking);

module.exports = router;
