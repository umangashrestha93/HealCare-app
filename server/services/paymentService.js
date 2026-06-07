const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const SUPPORTED_METHODS = [
  {
    id: 'card',
    provider: 'stripe',
    label: 'Debit / Credit Card',
    description: 'Secure hosted card checkout powered by Stripe.'
  },
  {
    id: 'paypal',
    provider: 'paypal',
    label: 'PayPal',
    description: 'Redirect to PayPal to log in and approve payment.'
  }
];

const hasSecret = (value) => Boolean(
  value && 
  !String(value).includes('replace-me') && 
  !String(value).includes('replace_with_your') &&
  !String(value).includes('replace-with')
);

const getClientBaseUrl = () => {
  const configured = process.env.CLIENT_APP_URL || process.env.CLIENT_URL?.split(',')?.[0];
  return (configured || 'http://localhost:5173').replace(/\/+$/, '');
};

const getPayPalApiBase = () => (
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
);

const isDemoEnabled = () => process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEMO_PAYMENTS !== 'false';

const getProviderForMethod = (method) => {
  if (method === 'card' && hasSecret(process.env.STRIPE_SECRET_KEY)) return 'stripe';
  if (method === 'paypal' && hasSecret(process.env.PAYPAL_CLIENT_ID) && hasSecret(process.env.PAYPAL_CLIENT_SECRET)) return 'paypal';
  if (isDemoEnabled()) return 'demo';
  return null;
};

const createReceiptNumber = () => {
  return `B5-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

const dollarsToCents = (amount) => Math.round(Number(amount || 0) * 100);

const centsToDollars = (amountCents) => Math.round(Number(amountCents || 0)) / 100;

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const err = new Error(data.error?.message || data.message || `Payment provider request failed: ${response.status}`);
    err.statusCode = response.status;
    err.providerResponse = data;
    throw err;
  }

  return data;
};

const createStripeCheckoutSession = async ({ booking, payment }) => {
  const clientBaseUrl = getClientBaseUrl();
  const params = new URLSearchParams();
  const currency = (booking.pricing?.currency || 'AUD').toLowerCase();
  const amountCents = payment.amountCents;
  const sessionName = `Beyond5 ${booking.serviceType === 'telehealth' ? 'telehealth' : 'clinic'} session`;

  params.append('mode', 'payment');
  params.append('payment_method_types[0]', 'card');
  params.append('success_url', `${clientBaseUrl}/payment/success?provider=stripe&bookingId=${booking._id}&session_id={CHECKOUT_SESSION_ID}`);
  params.append('cancel_url', `${clientBaseUrl}/payment/failure?provider=stripe&bookingId=${booking._id}`);
  params.append('line_items[0][quantity]', '1');
  params.append('line_items[0][price_data][currency]', currency);
  params.append('line_items[0][price_data][unit_amount]', String(amountCents));
  params.append('line_items[0][price_data][product_data][name]', sessionName);
  params.append('metadata[bookingId]', booking._id.toString());
  params.append('metadata[paymentId]', payment._id.toString());
  params.append('payment_intent_data[metadata][bookingId]', booking._id.toString());
  params.append('payment_intent_data[metadata][paymentId]', payment._id.toString());

  const session = await fetchJson('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });

  payment.providerSessionId = session.id;
  payment.checkoutUrl = session.url;
  payment.metadata = { ...(payment.metadata || {}), stripeSessionId: session.id };
  await payment.save();

  return {
    providerSessionId: session.id,
    checkoutUrl: session.url
  };
};

const getPayPalAccessToken = async () => {
  const credentials = Buffer
    .from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`)
    .toString('base64');

  const response = await fetchJson(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  return response.access_token;
};

const createPayPalOrder = async ({ booking, payment }) => {
  const token = await getPayPalAccessToken();
  const clientBaseUrl = getClientBaseUrl();

  const order = await fetchJson(`${getPayPalApiBase()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: booking._id.toString(),
          custom_id: booking._id.toString(),
          invoice_id: payment._id.toString(),
          description: 'Beyond5 healthcare booking',
          amount: {
            currency_code: booking.pricing?.currency || 'AUD',
            value: centsToDollars(payment.amountCents).toFixed(2)
          }
        }
      ],
      application_context: {
        brand_name: 'Beyond5',
        user_action: 'PAY_NOW',
        return_url: `${clientBaseUrl}/payment/success?provider=paypal&bookingId=${booking._id}`,
        cancel_url: `${clientBaseUrl}/payment/failure?provider=paypal&bookingId=${booking._id}`
      }
    })
  });

  const approvalLink = order.links?.find((link) => link.rel === 'approve')?.href;
  if (!approvalLink) {
    const err = new Error('PayPal did not return an approval link');
    err.statusCode = 502;
    throw err;
  }

  payment.providerOrderId = order.id;
  payment.providerSessionId = order.id;
  payment.checkoutUrl = approvalLink;
  payment.metadata = { ...(payment.metadata || {}), paypalOrderId: order.id };
  await payment.save();

  return {
    providerSessionId: order.id,
    checkoutUrl: approvalLink
  };
};

const createDemoCheckout = async ({ booking, payment }) => {
  const clientBaseUrl = getClientBaseUrl();
  const providerSessionId = `demo_${crypto.randomBytes(12).toString('hex')}`;

  payment.providerSessionId = providerSessionId;
  payment.checkoutUrl = `${clientBaseUrl}/payment/demo?bookingId=${booking._id}&paymentId=${payment._id}`;
  payment.metadata = { ...(payment.metadata || {}), mode: 'local-demo-checkout' };
  await payment.save();

  return {
    providerSessionId,
    checkoutUrl: payment.checkoutUrl
  };
};

const createCheckoutSession = async ({ booking, method = 'card' }) => {
  if (!SUPPORTED_METHODS.some((item) => item.id === method)) {
    const err = new Error('Unsupported payment method');
    err.statusCode = 400;
    throw err;
  }

  if (booking.paymentStatus === 'paid' || booking.status === 'confirmed') {
    const err = new Error('This booking has already been paid');
    err.statusCode = 409;
    throw err;
  }

  if (booking.paymentExpiresAt && booking.paymentExpiresAt < new Date()) {
    const err = new Error('This payment reservation has expired. Please create a new booking.');
    err.statusCode = 410;
    throw err;
  }

  const provider = getProviderForMethod(method);
  if (!provider) {
    const err = new Error(method === 'paypal'
      ? 'PayPal is not configured on the server'
      : 'Stripe card payments are not configured on the server');
    err.statusCode = 503;
    throw err;
  }

  await Payment.updateMany(
    { bookingId: booking._id, status: 'pending' },
    { $set: { status: 'failed', failureReason: 'Superseded by a new checkout attempt' } }
  );

  const payment = await Payment.create({
    bookingId: booking._id,
    clientId: booking.clientId,
    practitionerId: booking.practitionerId,
    provider,
    method,
    currency: booking.pricing?.currency || 'AUD',
    amountCents: dollarsToCents(booking.pricing?.total || 0),
    status: 'pending',
    metadata: {
      bookingReference: booking._id.toString()
    }
  });

  const session = provider === 'stripe'
    ? await createStripeCheckoutSession({ booking, payment })
    : provider === 'paypal'
      ? await createPayPalOrder({ booking, payment })
      : await createDemoCheckout({ booking, payment });

  booking.paymentStatus = 'pending';
  booking.paymentMethod = method;
  booking.payment = {
    provider,
    paymentId: payment._id,
    providerSessionId: session.providerSessionId
  };
  await booking.save();

  return {
    payment,
    status: 'pending',
    provider,
    method,
    checkoutUrl: session.checkoutUrl,
    providerSessionId: session.providerSessionId
  };
};

const markPaymentFailed = async ({ payment, reason }) => {
  if (!payment) return null;
  payment.status = 'failed';
  payment.failureReason = reason;
  await payment.save();

  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: 'failed',
    status: 'pending'
  });

  return payment;
};

const markPaymentSucceeded = async ({ payment, providerPaymentId, receiptNumber, amountCents, metadata = {} }) => {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) {
    const err = new Error('Booking not found for payment');
    err.statusCode = 404;
    throw err;
  }

  if (payment.status === 'paid' && (booking.status === 'pending_approval' || booking.status === 'confirmed')) {
    return { booking, payment };
  }

  if (Number(amountCents) !== Number(payment.amountCents)) {
    await markPaymentFailed({ payment, reason: 'Payment amount did not match booking total' });
    const err = new Error('Payment amount did not match booking total');
    err.statusCode = 400;
    throw err;
  }

  const paidAt = new Date();
  payment.status = 'paid';
  payment.providerOrderId = providerPaymentId || payment.providerOrderId;
  payment.receiptNumber = receiptNumber || payment.receiptNumber || createReceiptNumber();
  payment.paidAt = paidAt;
  payment.metadata = { ...(payment.metadata || {}), ...metadata };
  await payment.save();

  booking.status = 'pending_approval';
  booking.paymentStatus = 'paid';
  booking.payment = {
    provider: payment.provider,
    paymentId: payment._id,
    providerSessionId: payment.providerSessionId,
    receiptNumber: payment.receiptNumber,
    paidAt
  };
  await booking.save();

  return { booking, payment };
};

const retrieveStripeCheckoutSession = async (sessionId) => {
  return fetchJson(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`
    }
  });
};

const confirmStripeCheckout = async ({ sessionId, bookingId }) => {
  if (!hasSecret(process.env.STRIPE_SECRET_KEY)) {
    const err = new Error('Stripe is not configured on the server');
    err.statusCode = 503;
    throw err;
  }

  const session = await retrieveStripeCheckoutSession(sessionId);
  const payment = await Payment.findOne({
    provider: 'stripe',
    providerSessionId: session.id,
    ...(bookingId ? { bookingId } : {})
  });

  if (!payment) {
    const err = new Error('Payment record not found for Stripe session');
    err.statusCode = 404;
    throw err;
  }

  if (session.payment_status !== 'paid') {
    await markPaymentFailed({ payment, reason: `Stripe payment status: ${session.payment_status}` });
    const err = new Error('Stripe payment has not completed');
    err.statusCode = 402;
    throw err;
  }

  return markPaymentSucceeded({
    payment,
    providerPaymentId: session.payment_intent,
    amountCents: session.amount_total,
    metadata: { stripeSession: session }
  });
};

const capturePayPalOrder = async ({ orderId, bookingId }) => {
  if (!hasSecret(process.env.PAYPAL_CLIENT_ID) || !hasSecret(process.env.PAYPAL_CLIENT_SECRET)) {
    const err = new Error('PayPal is not configured on the server');
    err.statusCode = 503;
    throw err;
  }

  const token = await getPayPalAccessToken();
  const capture = await fetchJson(`${getPayPalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const payment = await Payment.findOne({
    provider: 'paypal',
    providerOrderId: orderId,
    ...(bookingId ? { bookingId } : {})
  });

  if (!payment) {
    const err = new Error('Payment record not found for PayPal order');
    err.statusCode = 404;
    throw err;
  }

  if (capture.status !== 'COMPLETED') {
    await markPaymentFailed({ payment, reason: `PayPal capture status: ${capture.status}` });
    const err = new Error('PayPal payment has not completed');
    err.statusCode = 402;
    throw err;
  }

  const captureItem = capture.purchase_units?.[0]?.payments?.captures?.[0];
  return markPaymentSucceeded({
    payment,
    providerPaymentId: captureItem?.id || capture.id,
    receiptNumber: captureItem?.id,
    amountCents: dollarsToCents(captureItem?.amount?.value || centsToDollars(payment.amountCents)),
    metadata: { paypalCapture: capture }
  });
};

const completeDemoPayment = async ({ bookingId, paymentId }) => {
  if (!isDemoEnabled()) {
    const err = new Error('Demo payments are disabled');
    err.statusCode = 403;
    throw err;
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    bookingId,
    provider: 'demo'
  });

  if (!payment) {
    const err = new Error('Demo payment record not found');
    err.statusCode = 404;
    throw err;
  }

  if (payment.status === 'paid') {
    const booking = await Booking.findById(payment.bookingId);
    return { booking, payment };
  }

  return markPaymentSucceeded({
    payment,
    providerPaymentId: payment.providerSessionId,
    amountCents: payment.amountCents,
    metadata: { demoApprovedAt: new Date() }
  });
};

const verifyStripeSignature = (rawBody, signatureHeader) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(signatureHeader.split(',').map((item) => {
    const [key, value] = item.split('=');
    return [key, value];
  }));

  if (!parts.t || !parts.v1) return false;

  const payload = `${parts.t}.${rawBody.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
};

module.exports = {
  SUPPORTED_METHODS,
  createCheckoutSession,
  confirmStripeCheckout,
  capturePayPalOrder,
  completeDemoPayment,
  markPaymentFailed,
  markPaymentSucceeded,
  verifyStripeSignature
};
