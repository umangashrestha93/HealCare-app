const Practitioner = require('../models/Practitioner');

// @desc    Get all approved practitioners with filters
// @route   GET /api/practitioners
// @access  Public (Gatekeeper Logic)
exports.getPractitioners = async (req, res) => {
  try {
    const { discipline, telehealth, afterHours, location, specialisation, specialization } = req.query;

    // Base query: Only approved practitioners
    let query = { verificationStatus: 'approved' };

    // Apply filters
    if (discipline) query.discipline = discipline;
    if (telehealth === 'true') query.telehealth = true;
    if (afterHours === 'true') query.afterHours = true;
    if (specialisation || specialization) {
      query.specializations = { $in: [specialisation || specialization] };
    }

    const practitioners = await Practitioner.find(query)
      .populate('userId', 'firstName lastName email location')
      .lean();

    const filteredPractitioners = location
      ? practitioners.filter((practitioner) => (
        practitioner.telehealth
        || practitioner.userId?.location?.toLowerCase().includes(location.toLowerCase())
      ))
      : practitioners;

    res.status(200).json({
      success: true,
      count: filteredPractitioners.length,
      data: filteredPractitioners
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc    Get logged-in practitioner's onboarding profile
// @route   GET /api/practitioners/profile
exports.getMyProfile = async (req, res) => {
  try {
    const practitioner = await Practitioner.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email location phone');

    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    res.status(500).json({ message: 'Profile retrieval failed', error: err.message });
  }
};

// @desc    Create or update logged-in practitioner's profile
// @route   PUT /api/practitioners/profile
exports.updateMyProfile = async (req, res) => {
  try {
    const {
      discipline,
      specializations,
      bio,
      yearsExp,
      abn,
      telehealth,
      afterHours,
      weekends
    } = req.body;

    const practitioner = await Practitioner.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        discipline: discipline || 'Other',
        specializations: Array.isArray(specializations) ? specializations : [],
        bio,
        yearsExp,
        abn,
        telehealth: Boolean(telehealth),
        afterHours: Boolean(afterHours),
        weekends: Boolean(weekends)
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};

// @desc    Add compliance document metadata to practitioner profile
// @route   POST /api/practitioners/upload
exports.uploadDocument = async (req, res) => {
  try {
    const { docType, expiryDate } = req.body;
    if (!docType) return res.status(400).json({ message: 'Document type is required' });

    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Create your practitioner profile before uploading documents' });
    }

    practitioner.complianceDocs.push({
      docType,
      url: req.file ? `/uploads/${req.file.filename}` : 'submitted-during-registration',
      status: 'pending',
      expiryDate
    });
    await practitioner.save();

    res.status(201).json({ success: true, data: practitioner.complianceDocs });
  } catch (err) {
    res.status(500).json({ message: 'Document upload failed', error: err.message });
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
