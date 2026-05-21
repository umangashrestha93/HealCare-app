const mongoose = require('mongoose');
const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Admin = require('../models/Admin');
const ComplianceLog = require('../models/ComplianceLog');
const SystemSettings = require('../models/SystemSettings');
require('../models/Payment');

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];
const MAX_PAGE_SIZE = 100;

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Math.max(1, Number.parseInt(query.limit, 10) || 50);
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
};

const publicPractitionerSelect = [
  'userId',
  'discipline',
  'specializations',
  'bio',
  'yearsExp',
  'abn',
  'location',
  'fee',
  'avatar',
  'availableSlots',
  'verificationStatus',
  'isVerified',
  'complianceDocs',
  'telehealth',
  'afterHours',
  'weekends',
  'createdAt',
  'updatedAt',
  'verifiedAt',
  'rejectedAt',
  'rejectionReason',
  'complianceNotes'
].join(' ');

const practitionerUserPopulate = {
  path: 'userId',
  match: { role: 'practitioner' },
  select: 'firstName lastName email phone location role createdAt'
};

const getAdminUserId = (req) => req.user?._id || req.user?.id;

const userSelect = 'firstName lastName email role status location phone createdAt deletedAt';

const sanitizeUser = (user) => {
  const value = user.toObject ? user.toObject() : user;
  delete value.password;
  return value;
};

const buildUserQuery = (query) => {
  const filters = { deletedAt: null };
  if (query.role && query.role !== 'all') filters.role = query.role;
  if (query.status && query.status !== 'all') filters.status = query.status;
  if (query.search) {
    const safe = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safe, 'i');
    filters.$or = [
      { firstName: regex },
      { lastName: regex },
      { email: regex },
      { phone: regex }
    ];
  }
  return filters;
};

const formatPractitionerResponse = (practitioner) => practitioner.toObject
  ? practitioner.toObject()
  : practitioner;

const getBookingPersonName = (user) => (
  [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
);

const buildBookingQuery = (query) => {
  const filters = {};

  if (query.status && query.status !== 'all') filters.status = query.status;
  if (query.paymentStatus && query.paymentStatus !== 'all') filters.paymentStatus = query.paymentStatus;
  if (query.serviceType && query.serviceType !== 'all') filters.serviceType = query.serviceType;

  if (query.dateFrom || query.dateTo) {
    filters.appointmentDate = {};
    if (query.dateFrom) {
      const from = new Date(query.dateFrom);
      from.setHours(0, 0, 0, 0);
      filters.appointmentDate.$gte = from;
    }
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      filters.appointmentDate.$lte = to;
    }
  }

  return filters;
};

const formatBookingForAdmin = (booking) => {
  const value = booking.toObject ? booking.toObject() : booking;
  const client = value.clientId;
  const practitionerUser = value.practitionerId?.userId;

  return {
    ...value,
    clientName: getBookingPersonName(client) || 'Unknown client',
    clientEmail: client?.email || '',
    practitionerName: getBookingPersonName(practitionerUser) || 'Unknown practitioner',
    practitionerEmail: practitionerUser?.email || '',
    practitionerDiscipline: value.practitionerId?.discipline || '',
    transactionId: value.payment?.receiptNumber || value.payment?.providerSessionId || value.payment?.paymentId?._id || value.payment?.paymentId || '-',
    amount: value.pricing?.total ?? 0,
    subtotal: value.pricing?.subtotal ?? 0,
    discountAmount: value.pricing?.discountAmount ?? 0,
    currency: value.pricing?.currency || 'AUD'
  };
};

const matchesBookingSearch = (booking, search) => {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;
  const haystack = [
    booking.clientName,
    booking.clientEmail,
    booking.practitionerName,
    booking.practitionerEmail,
    booking.practitionerDiscipline,
    booking.transactionId,
    booking.serviceType,
    booking.status,
    booking.paymentStatus
  ].join(' ').toLowerCase();
  return haystack.includes(term);
};

// @desc    Get practitioners for admin verification workflows
// @route   GET /api/admin/practitioners?status=pending
// @access  Private (Admin Only)
exports.getPractitioners = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Expected one of: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const { page, limit, skip } = parsePagination(req.query);
    const query = { verificationStatus: status };

    const [practitioners, total, statusCounts] = await Promise.all([
      Practitioner.find(query)
        .select(publicPractitionerSelect)
        .populate(practitionerUserPopulate)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Practitioner.countDocuments(query),
      Practitioner.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
      ])
    ]);

    const data = practitioners
      .filter((practitioner) => practitioner.userId)
      .map(formatPractitionerResponse);

    res.status(200).json({
      success: true,
      count: data.length,
      total,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1
      },
      counts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, { pending: 0, approved: 0, rejected: 0 }),
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Practitioner retrieval failed', error: err.message });
  }
};

const updatePractitionerStatus = async (req, res, status) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practitioner id' });
    }

    const adminUserId = getAdminUserId(req);
    const now = new Date();
    const existingPractitioner = await Practitioner.findById(id).select('verificationStatus userId');
    if (!existingPractitioner) {
      return res.status(404).json({ success: false, message: 'Practitioner not found' });
    }

    const setFields = {
      verificationStatus: status,
      isVerified: status === 'approved',
      updatedAt: now
    };
    const unsetFields = {};

    if (status === 'approved') {
      // Find the user to sync location
      const pToApprove = await Practitioner.findById(id).populate('userId');
      if (pToApprove?.userId) {
        setFields.location = pToApprove.userId.location;
      }
      
      setFields.verifiedAt = now;
      setFields.verifiedBy = adminUserId;
      unsetFields.rejectedAt = '';
      unsetFields.rejectedBy = '';
      unsetFields.rejectionReason = '';
    }

    if (status === 'rejected') {
      setFields.rejectedAt = now;
      setFields.rejectedBy = adminUserId;
      setFields.rejectionReason = req.body?.reason || 'Application did not meet verification requirements';
    }

    if (req.body?.note) {
      setFields.complianceNotes = [
        ...((await Practitioner.findById(id).select('complianceNotes'))?.complianceNotes || []),
        { note: req.body.note, createdBy: adminUserId, createdAt: now }
      ];
    }

    const updateOperation = { $set: setFields };
    if (Object.keys(unsetFields).length > 0) {
      updateOperation.$unset = unsetFields;
    }

    const practitioner = await Practitioner.findOneAndUpdate(
      { _id: id },
      updateOperation,
      { new: true, runValidators: true }
    )
      .select(publicPractitionerSelect)
      .populate(practitionerUserPopulate);

    if (!practitioner || !practitioner.userId) {
      return res.status(404).json({ success: false, message: 'Practitioner not found' });
    }

    await ComplianceLog.create({
      practitionerId: practitioner._id,
      adminId: adminUserId,
      action: status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'status-updated',
      fromStatus: existingPractitioner.verificationStatus,
      toStatus: status,
      note: req.body?.note || req.body?.reason || '',
      metadata: { practitionerUserId: existingPractitioner.userId }
    });

    res.status(200).json({
      success: true,
      message: `Practitioner ${status} successfully`,
      data: formatPractitionerResponse(practitioner)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Verification update failed', error: err.message });
  }
};

// @desc    Approve practitioner
// @route   PATCH /api/admin/practitioners/:id/approve
// @access  Private (Admin Only)
exports.approvePractitioner = (req, res) => updatePractitionerStatus(req, res, 'approved');

// @desc    Reject practitioner
// @route   PATCH /api/admin/practitioners/:id/reject
// @access  Private (Admin Only)
exports.rejectPractitioner = (req, res) => updatePractitionerStatus(req, res, 'rejected');

// @desc    Get single practitioner detail (admin only — bypasses public isVerified guard)
// @route   GET /api/admin/practitioners/:id
// @access  Private (Admin Only)
exports.getSinglePractitioner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practitioner id' });
    }

    const practitioner = await Practitioner.findById(id)
      .select(publicPractitionerSelect)
      .populate(practitionerUserPopulate);

    if (!practitioner || !practitioner.userId) {
      return res.status(404).json({ success: false, message: 'Practitioner not found' });
    }

    res.status(200).json({ success: true, data: formatPractitionerResponse(practitioner) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Practitioner retrieval failed', error: err.message });
  }
};

// Backward-compatible endpoints for the existing UI contract.
exports.getPendingPractitioners = (req, res) => {
  req.query.status = 'pending';
  return exports.getPractitioners(req, res);
};

exports.verifyPractitioner = async (req, res) => {
  const { status } = req.body;
  if (status === 'approved') return updatePractitionerStatus(req, res, 'approved');
  if (status === 'rejected') return updatePractitionerStatus(req, res, 'rejected');
  return res.status(400).json({ success: false, message: 'Invalid verification status' });
};

// @desc    Get Market Utilization Metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin Only)
exports.getMarketMetrics = async (req, res) => {
  try {
    const [
      totalBookings,
      activeSupply,
      verificationStats,
      disciplineStats,
      recentPractitioners
    ] = await Promise.all([
      Booking.countDocuments({ status: 'confirmed' }),
      Practitioner.countDocuments({ verificationStatus: 'approved', isVerified: true }),
      Practitioner.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } }
      ]),
      Practitioner.aggregate([
        { $match: { verificationStatus: 'approved', isVerified: true } },
        { $group: { _id: '$discipline', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Practitioner.find({})
        .select(publicPractitionerSelect)
        .populate(practitionerUserPopulate)
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const verificationCounts = verificationStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        activeSupply,
        pendingVerifications: verificationCounts.pending,
        rejectedPractitioners: verificationCounts.rejected,
        verificationCounts,
        marketUtilization: activeSupply ? (totalBookings / (activeSupply * 40)) * 100 : 0,
        demandByDiscipline: disciplineStats,
        recentPractitioners: recentPractitioners
          .filter((practitioner) => practitioner.userId)
          .map(formatPractitionerResponse)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Metrics retrieval failed', error: err.message });
  }
};

// @desc    Get bookings and transaction records for admin
// @route   GET /api/admin/bookings
// @access  Private (Admin Only)
exports.getAdminBookings = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = buildBookingQuery(req.query);

    const bookings = await Booking.find(query)
      .populate('clientId', 'firstName lastName email phone role')
      .populate({
        path: 'practitionerId',
        select: 'discipline userId fee',
        populate: { path: 'userId', select: 'firstName lastName email phone role' }
      })
      .populate('payment.paymentId', 'provider method status amountCents receiptNumber providerSessionId paidAt createdAt')
      .sort({ createdAt: -1 });

    const filtered = bookings
      .map(formatBookingForAdmin)
      .filter((booking) => matchesBookingSearch(booking, req.query.search));

    const pageData = filtered.slice(skip, skip + limit);
    const totalRevenue = filtered.reduce((sum, booking) => (
      booking.paymentStatus === 'paid' ? sum + Number(booking.amount || 0) : sum
    ), 0);

    const stats = filtered.reduce((acc, booking) => {
      acc.total += 1;
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      acc.payment[booking.paymentStatus] = (acc.payment[booking.paymentStatus] || 0) + 1;
      return acc;
    }, {
      total: 0,
      confirmed: 0,
      pending: 0,
      cancelled: 0,
      completed: 0,
      payment: { paid: 0, pending: 0, unpaid: 0, failed: 0, refunded: 0 }
    });

    res.status(200).json({
      success: true,
      data: pageData,
      stats: {
        ...stats,
        totalRevenue
      },
      pagination: {
        total: filtered.length,
        page,
        limit,
        pages: Math.ceil(filtered.length / limit) || 1
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Booking transaction retrieval failed', error: err.message });
  }
};

// @desc    Create a new admin user
// @route   POST /api/admin/users/admin
// @access  Private (Admin Only)
exports.createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const admin = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      data: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin creation failed', error: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = buildUserQuery(req.query);
    const [users, total] = await Promise.all([
      User.find(query).select(userSelect).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: users.map(sanitizeUser),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'User retrieval failed', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role = 'client', status = 'active', phone, location } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and password are required' });
    }
    if (!['client', 'practitioner', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      status,
      phone,
      location
    });

    if (role === 'admin') {
      await Admin.create({
        userId: user._id,
        adminRole: req.body.adminRole || 'support-admin',
        permissions: req.body.permissions || ['users:read'],
        createdBy: getAdminUserId(req)
      });
    }

    res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'User creation failed', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });

    const allowed = ['firstName', 'lastName', 'role', 'status', 'phone', 'location'];
    const update = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    if (update.role && !['client', 'practitioner', 'admin'].includes(update.role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (update.status && !['active', 'suspended'].includes(update.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: update },
      { new: true, runValidators: true }
    ).select(userSelect);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'User update failed', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    if (id === getAdminUserId(req)?.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: getAdminUserId(req), status: 'suspended' } },
      { new: true }
    ).select(userSelect);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'User deletion failed', error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [admins, total] = await Promise.all([
      Admin.find({})
        .populate('userId', userSelect)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Admin.countDocuments({})
    ]);

    res.status(200).json({
      success: true,
      data: admins.filter((admin) => admin.userId && !admin.userId.deletedAt),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin retrieval failed', error: err.message });
  }
};

exports.createAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, password, adminRole = 'support-admin', permissions = ['users:read'] } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'User already exists' });

    const user = await User.create({ firstName, lastName, email: email.toLowerCase(), password, role: 'admin' });
    const admin = await Admin.create({
      userId: user._id,
      adminRole,
      permissions,
      createdBy: getAdminUserId(req)
    });
    await admin.populate('userId', userSelect);

    res.status(201).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin creation failed', error: err.message });
  }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const update = {};
    ['adminRole', 'permissions', 'disabled'].forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });
    update.updatedBy = getAdminUserId(req);

    const admin = await Admin.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
      .populate('userId', userSelect);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin profile not found' });

    if (req.body.disabled !== undefined && admin.userId) {
      await User.findByIdAndUpdate(admin.userId._id, { status: req.body.disabled ? 'suspended' : 'active' });
    }

    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin update failed', error: err.message });
  }
};

exports.deleteAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin profile not found' });
    await User.findByIdAndUpdate(admin.userId, {
      deletedAt: new Date(),
      deletedBy: getAdminUserId(req),
      status: 'suspended'
    });
    admin.disabled = true;
    admin.updatedBy = getAdminUserId(req);
    await admin.save();
    res.status(200).json({ success: true, data: admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Admin deletion failed', error: err.message });
  }
};

exports.addComplianceNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, documentType } = req.body;
    if (!note) return res.status(400).json({ success: false, message: 'Note is required' });

    const practitioner = await Practitioner.findByIdAndUpdate(
      id,
      { $push: { complianceNotes: { note, createdBy: getAdminUserId(req), createdAt: new Date() } } },
      { new: true }
    ).select(publicPractitionerSelect).populate(practitionerUserPopulate);

    if (!practitioner) return res.status(404).json({ success: false, message: 'Practitioner not found' });

    await ComplianceLog.create({
      practitionerId: id,
      adminId: getAdminUserId(req),
      action: 'note-added',
      note,
      documentType,
      toStatus: practitioner.verificationStatus
    });

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Compliance note failed', error: err.message });
  }
};

exports.getComplianceLogs = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = {};
    if (req.query.practitionerId) query.practitionerId = req.query.practitionerId;
    if (req.query.action && req.query.action !== 'all') query.action = req.query.action;

    const [logs, total] = await Promise.all([
      ComplianceLog.find(query)
        .populate('adminId', 'firstName lastName email')
        .populate({
          path: 'practitionerId',
          select: 'discipline userId verificationStatus',
          populate: { path: 'userId', select: 'firstName lastName email' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ComplianceLog.countDocuments(query)
    ]);

    res.status(200).json({ success: true, data: logs, pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Compliance log retrieval failed', error: err.message });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.findOneAndUpdate(
      { key: 'platform' },
      { $setOnInsert: { key: 'platform' } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Settings retrieval failed', error: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const allowed = ['platform', 'bookingRules', 'featureToggles'];
    const update = { updatedBy: getAdminUserId(req) };
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    });

    const settings = await SystemSettings.findOneAndUpdate(
      { key: 'platform' },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.status(200).json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Settings update failed', error: err.message });
  }
};
