const Practitioner = require('../models/Practitioner');
const Booking = require('../models/Booking');

// @desc    Approve/Reject Practitioner
// @route   PUT /api/admin/practitioners/:id/verify
// @access  Private (Admin Only)
exports.verifyPractitioner = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    
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
    res.status(500).json({ message: 'Verification failed' });
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
        marketUtilization: (totalBookings / (totalPractitioners * 40)) * 100, // Simulated: 40 slots/week
        demandByDiscipline: disciplineStats
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Metrics retrieval failed' });
  }
};
