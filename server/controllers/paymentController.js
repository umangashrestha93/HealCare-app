const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');
const {
  SUPPORTED_METHODS,
  createCheckoutSession,
  confirmStripeCheckout,
  capturePayPalOrder,
  completeDemoPayment,
  markPaymentFailed,
  verifyStripeSignature
} = require('../services/paymentService');

exports.getPaymentMethods = async (req, res) => {
  res.status(200).json({
    success: true,
    provider: process.env.PAYMENT_PROVIDER || 'demo',
    data: SUPPORTED_METHODS
  });
};

exports.getBookingPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId }).lean();
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found for this booking' });
    }

    if (req.user.role === 'client' && payment.clientId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    if (req.user.role === 'practitioner') {
      const practitioner = await Practitioner.findOne({ userId: req.user.id }).select('_id').lean();
      if (!practitioner || payment.practitionerId.toString() !== practitioner._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this payment' });
      }
    }

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve payment', error: err.message });
  }
};

const populateBooking = (query) => query
  .populate('clientId', 'firstName lastName email')
  .populate({
    path: 'practitionerId',
    populate: { path: 'userId', select: 'firstName lastName email' }
  });

const ensureBookingOwner = async (bookingId, user) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'client' || booking.clientId.toString() !== user.id.toString()) {
    const err = new Error('Not authorized to pay for this booking');
    err.statusCode = 403;
    throw err;
  }

  return booking;
};

exports.createCheckout = async (req, res) => {
  try {
    const { bookingId, method } = req.body;
    if (!bookingId || !method) {
      return res.status(400).json({ message: 'bookingId and payment method are required' });
    }

    const booking = await ensureBookingOwner(bookingId, req.user);
    const checkout = await createCheckoutSession({ booking, method });

    res.status(201).json({
      success: true,
      message: 'Payment checkout created',
      data: {
        bookingId: booking._id,
        paymentId: checkout.payment._id,
        provider: checkout.provider,
        method: checkout.method,
        status: checkout.status,
        checkoutUrl: checkout.checkoutUrl,
        providerSessionId: checkout.providerSessionId
      }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Failed to create payment checkout',
      error: err.statusCode ? undefined : err.message
    });
  }
};

exports.confirmPaymentReturn = async (req, res) => {
  try {
    const {
      provider,
      bookingId,
      sessionId,
      orderId,
      paymentId
    } = req.body;

    if (!provider || !bookingId) {
      return res.status(400).json({ message: 'provider and bookingId are required' });
    }

    await ensureBookingOwner(bookingId, req.user);

    let result;
    if (provider === 'stripe') {
      result = await confirmStripeCheckout({ sessionId, bookingId });
    } else if (provider === 'paypal') {
      result = await capturePayPalOrder({ orderId, bookingId });
    } else if (provider === 'demo') {
      result = await completeDemoPayment({ bookingId, paymentId });
    } else {
      return res.status(400).json({ message: 'Unsupported payment provider' });
    }

    const booking = await populateBooking(Booking.findById(result.booking._id));

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed',
      data: booking,
      payment: result.payment
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Payment confirmation failed',
      error: err.statusCode ? undefined : err.message
    });
  }
};

exports.markPaymentCancelled = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: 'bookingId is required' });

    await ensureBookingOwner(bookingId, req.user);
    const payment = await Payment.findOne({ bookingId, status: 'pending' }).sort({ createdAt: -1 });
    if (payment) {
      await markPaymentFailed({ payment, reason: 'User cancelled checkout' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment was not completed. Booking remains unconfirmed.'
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Failed to cancel payment',
      error: err.statusCode ? undefined : err.message
    });
  }
};

exports.handleStripeWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'])) {
      return res.status(400).json({ message: 'Invalid Stripe webhook signature' });
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await confirmStripeCheckout({ sessionId: event.data.object.id });
    }

    if (event.type === 'checkout.session.async_payment_failed' || event.type === 'payment_intent.payment_failed') {
      const sessionId = event.data.object.id;
      const payment = await Payment.findOne({ provider: 'stripe', providerSessionId: sessionId });
      if (payment) await markPaymentFailed({ payment, reason: event.type });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ message: 'Stripe webhook handling failed', error: err.message });
  }
};

exports.handlePayPalWebhook = async (req, res) => {
  try {
    const event = req.body;
    const orderId = event?.resource?.supplementary_data?.related_ids?.order_id
      || event?.resource?.id
      || event?.resource?.custom_id;

    if (event?.event_type === 'CHECKOUT.ORDER.APPROVED' && orderId) {
      await capturePayPalOrder({ orderId });
    }

    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ message: 'PayPal webhook handling failed', error: err.message });
  }
};
