const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get pending practitioner applications
// @route   GET /api/admin/practitioners/pending
// @access  Private (Admin Only)
exports.getPendingPractitioners = async (req, res) => {
  try {
    const practitioners = await Practitioner.find({ verificationStatus: 'pending' })
      .populate('userId', 'firstName lastName email phone location')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: practitioners.length,
      data: practitioners
    });
  } catch (err) {
    res.status(500).json({ message: 'Pending practitioner retrieval failed', error: err.message });
  }
};

// @desc    Approve/Reject Practitioner
// @route   PUT /api/admin/practitioners/:id/verify
// @access  Private (Admin Only)
exports.verifyPractitioner = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid verification status' });
    }
    
    const practitioner = await Practitioner.findById(req.params.id);
    if (!practitioner) return res.status(404).json({ message: 'Practitioner not found' });

    practitioner.verificationStatus = status;
    practitioner.isVerified = (status === 'approved');
    await practitioner.save();

    res.status(200).json({
      success: true,
      message: `Practitioner ${status} successfully`
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

// @desc    Get Market Utilization Metrics (Supply & Demand Balance)
// @route   GET /api/admin/metrics
exports.getMarketMetrics = async (req, res) => {
  try {
    // 1. Calculate Utilization (Total Bookings / Total Availability)
    const totalBookings = await Booking.countDocuments({ status: 'confirmed' });
    const totalPractitioners = await Practitioner.countDocuments({ isVerified: true });
    
    // 2. Identify High Demand Disciplines
    const disciplineStats = await Practitioner.aggregate([
      { $group: { _id: '$discipline', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        activeSupply: totalPractitioners,
        marketUtilization: totalPractitioners ? (totalBookings / (totalPractitioners * 40)) * 100 : 0,
        demandByDiscipline: disciplineStats
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Metrics retrieval failed', error: err.message });
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
    res.status(500).json({ message: 'Admin creation failed', error: err.message });
  }
};
