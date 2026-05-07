const Practitioner = require('../models/Practitioner');
const User = require('../models/User');

// @desc    Get all approved practitioners with filters
// @route   GET /api/practitioners
// @access  Public (Gatekeeper Logic)
exports.getPractitioners = async (req, res) => {
  try {
    const { discipline, telehealth, afterHours, location } = req.query;

    // Base query: Only approved practitioners
    let query = { verificationStatus: 'approved' };

    // Apply filters
    if (discipline) query.discipline = discipline;
    if (telehealth === 'true') query.telehealth = true;
    if (afterHours === 'true') query.afterHours = true;

    const practitioners = await Practitioner.find(query)
      .populate('userId', 'firstName lastName email location')
      .lean();

    res.status(200).json({
      success: true,
      count: practitioners.length,
      data: practitioners
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get single practitioner by ID
// @route   GET /api/practitioners/:id
exports.getPractitioner = async (req, res) => {
  try {
    const practitioner = await Practitioner.findById(req.params.id)
      .populate('userId', 'firstName lastName email location phone');

    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner not found' });
    }

    res.status(200).json({
      success: true,
      data: practitioner,
      isVerified: practitioner.isVerified // Trust Signal
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
};
