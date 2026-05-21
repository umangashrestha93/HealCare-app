const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const devUserStore = require('../utils/devUserStore');

const OFFER_CODE = process.env.MEDICARE_OFFER_CODE || 'MEDICARE_ACCESS';
const OFFER_PERCENT = Math.min(Math.max(Number(process.env.MEDICARE_OFFER_PERCENT || 15), 0), 80);

const isMongoConnected = () => mongoose.connection.readyState === 1;

const getHashSecret = () => {
  return process.env.MEDICARE_HASH_SECRET || process.env.JWT_SECRET || 'beyond5-dev-secret';
};

const normalizeCardNumber = (value = '') => value.replace(/\D/g, '');

const isFutureExpiry = (month, year) => {
  const expiryMonth = Number(month);
  const expiryYear = Number(year);
  if (!expiryMonth || !expiryYear || expiryMonth < 1 || expiryMonth > 12) return false;
  const now = new Date();
  const expiryEnd = new Date(expiryYear, expiryMonth, 0, 23, 59, 59, 999);
  return expiryEnd >= now;
};

const createMedicareRecord = ({ cardNumber, holderName, referenceNumber, expiryMonth, expiryYear }) => {
  const normalized = normalizeCardNumber(cardNumber);
  if (normalized.length !== 10) {
    const err = new Error('Medicare card number must contain 10 digits');
    err.statusCode = 400;
    throw err;
  }

  if (!/^\d{1,2}$/.test(String(referenceNumber || ''))) {
    const err = new Error('Individual reference number must be 1 or 2 digits');
    err.statusCode = 400;
    throw err;
  }

  if (!isFutureExpiry(expiryMonth, expiryYear)) {
    const err = new Error('Medicare card expiry must be a future month');
    err.statusCode = 400;
    throw err;
  }

  const numberHash = crypto
    .createHmac('sha256', getHashSecret())
    .update(normalized)
    .digest('hex');

  return {
    status: 'verified',
    holderName: holderName?.trim(),
    numberLast4: normalized.slice(-4),
    numberHash,
    referenceNumber: String(referenceNumber),
    expiryMonth: Number(expiryMonth),
    expiryYear: Number(expiryYear),
    offerCode: OFFER_CODE,
    offerPercent: OFFER_PERCENT,
    verifiedAt: new Date(),
    updatedAt: new Date()
  };
};

const formatOffer = (medicareCard) => {
  const eligible = medicareCard?.status === 'verified' && Number(medicareCard.offerPercent) > 0;
  return {
    eligible,
    status: medicareCard?.status || 'not_submitted',
    offerCode: eligible ? medicareCard.offerCode : null,
    percent: eligible ? medicareCard.offerPercent : 0,
    numberLast4: medicareCard?.numberLast4 || null,
    expiryMonth: medicareCard?.expiryMonth || null,
    expiryYear: medicareCard?.expiryYear || null
  };
};

exports.getMyMedicareOffer = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Medicare offers are available for client accounts only' });
    }

    if (!isMongoConnected()) {
      const user = await devUserStore.findById(req.user.id);
      return res.status(200).json({ success: true, offer: formatOffer(user?.medicareCard) });
    }

    const user = await User.findById(req.user.id).select('medicareCard').lean();
    res.status(200).json({ success: true, offer: formatOffer(user?.medicareCard) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load Medicare offer', error: err.message });
  }
};

exports.verifyMedicareCard = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Medicare offers are available for client accounts only' });
    }

    const medicareCard = createMedicareRecord(req.body);

    if (!isMongoConnected()) {
      const user = await devUserStore.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      await devUserStore.upsertUser({ ...user, medicareCard });
      return res.status(200).json({
        success: true,
        message: 'Medicare offer applied',
        offer: formatOffer(medicareCard)
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { medicareCard },
      { new: true, runValidators: true }
    ).select('medicareCard');

    res.status(200).json({
      success: true,
      message: 'Medicare offer applied',
      offer: formatOffer(user.medicareCard)
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      message: err.statusCode ? err.message : 'Medicare verification failed',
      error: err.statusCode ? undefined : err.message
    });
  }
};
