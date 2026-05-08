const Practitioner = require('../models/Practitioner');

// @desc    Get all approved practitioners with filters & pagination
// @route   GET /api/practitioners
// @access  Public
exports.getPractitioners = async (req, res) => {
  try {
    const { 
      discipline, 
      telehealth, 
      afterHours, 
      weekends,
      location, 
      keyword,
      page = 1,
      limit = 10 
    } = req.query;

    // Base query: Only approved practitioners
    let query = { verificationStatus: 'approved' };

    // Apply strict filters
    if (discipline && discipline !== 'All') query.discipline = discipline;
    if (telehealth === 'true') query.telehealth = true;
    if (afterHours === 'true') query.afterHours = true;
    if (weekends === 'true') query.weekends = true;

    // 1. Keyword Search (Search across Name, Bio, Discipline)
    if (keyword && keyword.trim() !== '') {
      // Escape special characters for regex
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedKeyword, 'i');
      
      query.$or = [
        { discipline: searchRegex },
        { bio: searchRegex },
        { specializations: { $elemMatch: { $regex: searchRegex } } }
      ];
    }

    // 2. Pagination Logic
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // 3. Fetch Data with Population
    let practitioners = await Practitioner.find(query)
      .populate('userId', 'firstName lastName avatar location')
      .skip(skip)
      .limit(limitNum)
      .sort('-createdAt')
      .lean();

    // 4. Manual Post-Processing (for nested field filters like location)
    if (location && location.trim() !== '') {
      practitioners = practitioners.filter(p => {
        const locMatch = p.userId?.location?.toLowerCase().includes(location.toLowerCase());
        return p.telehealth || locMatch;
      });
    }

    // Keyword search on name (manual since it's a populated field)
    if (keyword && keyword.trim() !== '') {
      const searchTerms = keyword.toLowerCase().split(' ');
      practitioners = practitioners.filter(p => {
        const fullName = `${p.userId?.firstName} ${p.userId?.lastName}`.toLowerCase();
        // Check if name matches (simple implementation)
        const nameMatch = searchTerms.every(term => fullName.includes(term));
        
        // If it matches name, keep it. Otherwise check if it matches discipline/bio (already done by MongoDB)
        // But since we filtered the array here, we should ensure we don't lose results
        return nameMatch || practitioners.includes(p); 
      });
    }

    const total = await Practitioner.countDocuments(query);

    res.status(200).json({
      success: true,
      count: practitioners.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1
      },
      data: practitioners
    });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ success: false, message: 'Practitioner fetch failed', error: err.message });
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
