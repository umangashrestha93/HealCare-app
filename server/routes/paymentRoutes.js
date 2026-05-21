const express = require('express');
const {
  getPaymentMethods,
  getBookingPayment,
  createCheckout,
  confirmPaymentReturn,
  markPaymentCancelled,
  handlePayPalWebhook
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/webhook/paypal', handlePayPalWebhook);

router.get('/methods', protect, getPaymentMethods);
router.post('/checkout', protect, createCheckout);
router.post('/confirm', protect, confirmPaymentReturn);
router.post('/cancel', protect, markPaymentCancelled);
router.get('/booking/:bookingId', protect, getBookingPayment);

module.exports = router;
