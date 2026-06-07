const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const Practitioner = require('../models/Practitioner');
const User = require('../models/User');
const devEnquiryStore = require('../utils/devEnquiryStore');

const isMongoConnected = () => mongoose.connection.readyState === 1;
const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getUserId = (req) => String(req.user?._id || req.user?.id || '');

const sanitizeBody = (body) => ({
  practitionerId: body.practitionerId,
  practitionerName: String(body.practitionerName || '').trim(),
  practitionerDiscipline: String(body.practitionerDiscipline || '').trim(),
  name: String(body.name || '').trim(),
  email: String(body.email || '').trim().toLowerCase(),
  phone: String(body.phone || '').trim(),
  message: String(body.message || '').trim(),
  fundingOptions: Array.isArray(body.fundingOptions) ? body.fundingOptions : [],
  preferredPostcode: String(body.preferredPostcode || '').trim()
});

const validateEnquiry = (payload) => {
  if (!payload.practitionerId) return 'Practitioner is required';
  if (!payload.practitionerName) return 'Practitioner name is required';
  if (!payload.name) return 'Your name is required';
  if (!payload.email) return 'Email is required';
  if (!payload.message) return 'Message is required';
  if (payload.message.length > 2000) return 'Message must be 2000 characters or less';
  return '';
};

exports.createEnquiry = async (req, res) => {
  try {
    const payload = sanitizeBody(req.body);
    const validationError = validateEnquiry(payload);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const clientId = getUserId(req);

    if (!isMongoConnected()) {
      const enquiry = await devEnquiryStore.create({
        clientId,
        practitionerId: isObjectId(payload.practitionerId) ? payload.practitionerId : undefined,
        practitionerExternalId: isObjectId(payload.practitionerId) ? undefined : payload.practitionerId,
        practitionerName: payload.practitionerName,
        practitionerDiscipline: payload.practitionerDiscipline,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        message: payload.message,
        fundingOptions: payload.fundingOptions,
        preferredPostcode: payload.preferredPostcode
      });

      return res.status(201).json({ success: true, data: enquiry });
    }

    let practitionerSnapshot = {
      practitionerName: payload.practitionerName,
      practitionerDiscipline: payload.practitionerDiscipline
    };

    let practitionerEmail = '';

    if (isObjectId(payload.practitionerId)) {
      const practitioner = await Practitioner.findById(payload.practitionerId)
        .populate('userId', 'firstName lastName email')
        .lean();

      if (practitioner) {
        practitionerEmail = practitioner.userId?.email || '';
        practitionerSnapshot = {
          practitionerName: [practitioner.userId?.firstName, practitioner.userId?.lastName].filter(Boolean).join(' ') || payload.practitionerName,
          practitionerDiscipline: practitioner.discipline || payload.practitionerDiscipline
        };
      }
    }

    const enquiry = await Enquiry.create({
      clientId,
      practitionerId: isObjectId(payload.practitionerId) ? payload.practitionerId : undefined,
      practitionerExternalId: isObjectId(payload.practitionerId) ? undefined : payload.practitionerId,
      ...practitionerSnapshot,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      fundingOptions: payload.fundingOptions,
      preferredPostcode: payload.preferredPostcode
    });

    // Return practitionerEmail so the frontend can send a direct email notification
    res.status(201).json({ success: true, data: enquiry, practitionerEmail });

    // Asynchronously send SMTP email notifications from the backend if practitioner email exists
    if (practitionerEmail) {
      const emailService = require('../services/emailService');
      const submittedAt = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney' });
      
      emailService.sendEnquiryEmail({
        practitionerEmail,
        practitionerName: enquiry.practitionerName,
        practitionerDiscipline: enquiry.practitionerDiscipline,
        clientName: enquiry.name,
        clientEmail: enquiry.email,
        clientPhone: enquiry.phone,
        message: enquiry.message,
        fundingOptions: enquiry.fundingOptions,
        preferredPostcode: enquiry.preferredPostcode,
        submittedAt
      }).catch((err) => console.error('[Email Service] Background enquiry email failed:', err));
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Enquiry submission failed', error: err.message });
  }
};

exports.getMyEnquiries = async (req, res) => {
  try {
    const clientId = getUserId(req);

    if (!isMongoConnected()) {
      const enquiries = await devEnquiryStore.findForClient(clientId);
      return res.status(200).json({ success: true, data: enquiries });
    }

    const enquiries = await Enquiry.find({ clientId }).sort('-createdAt').lean();
    res.status(200).json({ success: true, data: enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load enquiries', error: err.message });
  }
};

exports.getAllEnquiries = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const enquiries = await devEnquiryStore.findAll();
      return res.status(200).json({ success: true, data: enquiries });
    }

    const enquiries = await Enquiry.find({})
      .populate('clientId', 'firstName lastName email phone')
      .sort('-createdAt')
      .lean();

    res.status(200).json({ success: true, data: enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load enquiries', error: err.message });
  }
};
