const mongoose = require('mongoose');
const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');
const User = require('../models/User');

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];
const MAX_PAGE_SIZE = 100;

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const requestedLimit = Math.max(1, Number.parseInt(query.limit, 10) || 50);
  const limit = Math.min(requestedLimit, MAX_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
};

const publicPractitionerSelect = [
  'discipline',
  'specializations',
  'bio',
  'yearsExp',
  'abn',
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
  'rejectionReason'
].join(' ');

const practitionerUserPopulate = {
  path: 'userId',
  match: { role: 'practitioner' },
  select: 'firstName lastName email phone location role createdAt'
};

const getAdminUserId = (req) => req.user?._id || req.user?.id;

const formatPractitionerResponse = (practitioner) => practitioner.toObject
  ? practitioner.toObject()
  : practitioner;

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
    const setFields = {
      verificationStatus: status,
      isVerified: status === 'approved',
      updatedAt: now
    };
    const unsetFields = {};

    if (status === 'approved') {
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
