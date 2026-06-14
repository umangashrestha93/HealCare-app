const jwt = require('jsonwebtoken');
const Practitioner = require('../models/Practitioner');
const User = require('../models/User');

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
      funding,
      postcode,
      page = 1,
      limit = 10 
    } = req.query;

    // Base query: Only approved practitioners
    // Relying on verificationStatus as the primary source of truth
    let query = { 
      verificationStatus: 'approved'
    };

    console.log('[API] Marketplace Query:', JSON.stringify(query));

    // Discipline filter
    if (discipline && discipline !== 'All') query.discipline = discipline;

    // Availability flag filters (Handle boolean strings from query params)
    if (telehealth !== undefined) query.telehealth = telehealth === 'true';
    if (afterHours === 'true') query.afterHours = true;
    if (weekends === 'true') query.weekends = true;

    // Keyword Search (Search across practitioner names, discipline, bio, specializations)
    if (keyword && keyword.trim() !== '') {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedKeyword, 'i');
      const matchingUsers = await User.find({
        role: 'practitioner',
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          {
            $expr: {
              $regexMatch: {
                input: { $concat: ['$firstName', ' ', '$lastName'] },
                regex: escapedKeyword,
                options: 'i'
              }
            }
          }
        ]
      }).select('_id').lean();

      query.$or = [
        { userId: { $in: matchingUsers.map((user) => user._id) } },
        { discipline: searchRegex },
        { bio: searchRegex },
        { specializations: { $elemMatch: { $regex: searchRegex } } }
      ];
    }

    // Location filter (Now indexed and part of the main query)
    if (location && location.trim() !== '') {
      query.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    if (funding && funding.trim() !== '') {
      query.fundingOptions = { $in: funding.split(',').map((item) => item.trim()).filter(Boolean) };
    }

    if (postcode && postcode.trim() !== '') {
      const escapedPostcode = postcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { postcode: escapedPostcode },
            { travelsToPostcodes: escapedPostcode },
            { location: { $regex: escapedPostcode, $options: 'i' } }
          ]
        }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(Math.max(1, parseInt(limit)), 50);
    const skip = (pageNum - 1) * limitNum;

    // Fetch with populate
    const practitioners = await Practitioner.find(query)
      .populate('userId', 'firstName lastName avatar location email sex age')
      .skip(skip)
      .limit(limitNum)
      .sort('-createdAt')
      .lean();

    // Re-count for filtered total
    const total = await Practitioner.countDocuments(query);

    console.log(`[API] Found ${practitioners.length} practitioners out of ${total} total matches`);

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
// @access  Private (Practitioner)
exports.getMyProfile = async (req, res) => {
  try {
    const practitioner = await Practitioner.findOne({ userId: req.user.id })
      .populate('userId', 'firstName lastName email location phone sex age')
      .select('+photos');

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
// @access  Private (Practitioner)
exports.updateMyProfile = async (req, res) => {
  try {
    const {
      discipline,
      specializations,
      bio,
      yearsExp,
      abn,
      gender,
      location,
      postcode,
      travelArea,
      travelsToPostcodes,
      mobile,
      fundingOptions,
      sploseStatus,
      telehealth,
      afterHours,
      weekends,
      fee,
      avatar,
      photos,
      availableSlots,
      sex,
      age
    } = req.body;

    const updatePayload = {
      userId: req.user.id,
      discipline: discipline || 'Other',
      specializations: Array.isArray(specializations) ? specializations : [],
      bio,
      yearsExp,
      abn,
      gender,
      location,
      postcode,
      travelArea,
      travelsToPostcodes: Array.isArray(travelsToPostcodes)
        ? travelsToPostcodes
        : String(travelsToPostcodes || '').split(',').map((item) => item.trim()).filter(Boolean),
      mobile: Boolean(mobile),
      fundingOptions: Array.isArray(fundingOptions) ? fundingOptions : [],
      sploseStatus,
      telehealth: Boolean(telehealth),
      afterHours: Boolean(afterHours),
      weekends: Boolean(weekends)
    };

    if (fee !== undefined) updatePayload.fee = Number(fee);
    if (avatar !== undefined) updatePayload.avatar = avatar;
    if (Array.isArray(photos)) updatePayload.photos = photos.slice(0, 7); // max 7 photos
    if (Array.isArray(availableSlots)) updatePayload.availableSlots = availableSlots;

    if (sex !== undefined || age !== undefined) {
      const userUpdates = {};
      if (sex !== undefined) userUpdates.sex = sex;
      if (age !== undefined) userUpdates.age = age;
      await User.findByIdAndUpdate(req.user.id, userUpdates);
    }

    const practitioner = await Practitioner.findOneAndUpdate(
      { userId: req.user.id },
      updatePayload,
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: practitioner });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};

// @desc    Add compliance document metadata to practitioner profile
// @route   POST /api/practitioners/upload
// @access  Private (Practitioner)
exports.uploadDocument = async (req, res) => {
  try {
    const { docType, expiryDate } = req.body;
    if (!docType) return res.status(400).json({ message: 'Document type is required' });
    if (!['AHPRA', 'Insurance', 'WWCC'].includes(docType)) {
      return res.status(400).json({ message: 'Unsupported document type' });
    }
    if (!req.file) return res.status(400).json({ message: 'Document file is required' });

    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Create your practitioner profile before uploading documents' });
    }

    const nextDoc = {
      docType,
      url: `/uploads/compliance/${req.file.filename}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'pending',
      expiryDate: expiryDate || undefined,
      uploadedAt: new Date()
    };

    const existingIndex = practitioner.complianceDocs.findIndex((doc) => doc.docType === docType);
    if (existingIndex >= 0) {
      practitioner.complianceDocs.set(existingIndex, nextDoc);
    } else {
      practitioner.complianceDocs.push(nextDoc);
    }

    practitioner.verificationStatus = 'pending';
    practitioner.isVerified = false;
    await practitioner.save();

    res.status(201).json({ success: true, data: practitioner.complianceDocs, practitioner });
  } catch (err) {
    res.status(500).json({ message: 'Document upload failed', error: err.message });
  }
};

// @desc    Get single approved practitioner by ID (public listing)
// @route   GET /api/practitioners/:id
// @access  Public
exports.getPractitioner = async (req, res) => {
  try {
    const practitioner = await Practitioner.findById(req.params.id)
      .populate('userId', 'firstName lastName email location phone sex age');

    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner not found' });
    }

    // Check if the requester is the owner of this profile or an admin
    let reqUserId = null;
    let reqUserRole = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        reqUserId = decoded.id;
        
        // Find user to verify role
        const user = await User.findById(reqUserId);
        if (user) {
          reqUserRole = user.role;
        }
      } catch (e) {
        // Ignore invalid token
      }
    }

    const isOwner = reqUserId && practitioner.userId && (practitioner.userId._id || practitioner.userId).toString() === reqUserId.toString();
    const isAdmin = reqUserRole === 'admin';

    // If practitioner is not approved or not verified, only allow owner or admin
    if (practitioner.verificationStatus !== 'approved' || !practitioner.isVerified) {
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'This practitioner profile is pending review and is not publicly accessible.' });
      }
    }

    res.status(200).json({
      success: true,
      data: practitioner,
      isVerified: practitioner.isVerified
    });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ─── myGigster Embedded Finance Endpoints ─────────────────────────────────

exports.getMyGigsterInfo = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    // Initialize myGigster block if undefined (safe fallback)
    if (!practitioner.myGigster) {
      practitioner.myGigster = { isSetup: false, bankDetails: {}, expenses: [], payoutHistory: [] };
    }

    // Calculate dynamic available balance from Bookings database
    // All bookings for this practitioner where paymentStatus is paid
    const bookings = await Booking.find({ 
      practitionerId: practitioner._id, 
      paymentStatus: 'paid' 
    }).lean();

    const grossEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    const totalPayouts = practitioner.myGigster.payoutHistory.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, grossEarnings - totalPayouts);

    // Calculate total deductions
    const totalDeductions = practitioner.myGigster.expenses.reduce((sum, e) => sum + e.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        myGigster: practitioner.myGigster,
        metrics: {
          grossEarnings,
          totalPayouts,
          availableBalance,
          totalDeductions,
          estimatedTaxSaved: Number((totalDeductions * (practitioner.myGigster.taxReservePercentage / 100)).toFixed(2))
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve myGigster details', error: err.message });
  }
};

exports.setupMyGigster = async (req, res) => {
  try {
    const { bankName, bsb, accountNumber, accountHolder, taxReservePercentage } = req.body;
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    practitioner.myGigster.isSetup = true;
    practitioner.myGigster.accountId = `mg_acc_${Math.random().toString(36).substr(2, 9)}`;
    practitioner.myGigster.taxReservePercentage = taxReservePercentage !== undefined ? Number(taxReservePercentage) : 20;
    practitioner.myGigster.bankDetails = {
      bankName: bankName || 'Standard Bank',
      bsb: bsb || '',
      accountNumber: accountNumber || '',
      accountHolder: accountHolder || ''
    };

    await practitioner.save();
    res.status(200).json({ success: true, message: 'myGigster account linked successfully', data: practitioner.myGigster });
  } catch (err) {
    res.status(500).json({ message: 'Failed to setup myGigster account', error: err.message });
  }
};

exports.payoutMyGigster = async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    if (!practitioner.myGigster.isSetup) {
      return res.status(400).json({ message: 'myGigster is not setup yet' });
    }

    // Calculate available balance to prevent over-drafting
    const bookings = await Booking.find({ 
      practitionerId: practitioner._id, 
      paymentStatus: 'paid' 
    }).lean();

    const grossEarnings = bookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0);
    const totalPayouts = practitioner.myGigster.payoutHistory.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = Math.max(0, grossEarnings - totalPayouts);

    if (availableBalance <= 0) {
      return res.status(400).json({ message: 'No funds available for cashout' });
    }

    // Create the payout record
    const payoutAmount = availableBalance;
    const payoutRecord = {
      amount: payoutAmount,
      date: new Date(),
      status: 'Completed',
      reference: `mg_tx_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    };

    practitioner.myGigster.payoutHistory.push(payoutRecord);
    await practitioner.save();

    res.status(200).json({ 
      success: true, 
      message: 'Instant payout completed successfully', 
      data: payoutRecord 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to process instant payout', error: err.message });
  }
};

exports.addMyGigsterExpense = async (req, res) => {
  try {
    const { description, amount, category, mileageKm } = req.body;
    if (!description || amount === undefined) {
      return res.status(400).json({ message: 'Description and amount are required' });
    }

    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    const newExpense = {
      description,
      amount: Number(amount),
      category: category || 'Other',
      mileageKm: mileageKm ? Number(mileageKm) : 0,
      date: new Date()
    };

    practitioner.myGigster.expenses.push(newExpense);
    await practitioner.save();

    res.status(200).json({ 
      success: true, 
      message: 'Expense logged successfully', 
      data: practitioner.myGigster.expenses[practitioner.myGigster.expenses.length - 1] 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to add expense', error: err.message });
  }
};

exports.deleteMyGigsterExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    practitioner.myGigster.expenses = practitioner.myGigster.expenses.filter(
      (expense) => expense._id.toString() !== id
    );

    await practitioner.save();
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
};

exports.updateMyGigsterSettings = async (req, res) => {
  try {
    const { bankName, bsb, accountNumber, accountHolder, taxReservePercentage } = req.body;
    const practitioner = await Practitioner.findOne({ userId: req.user.id });
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner profile not found' });
    }

    if (taxReservePercentage !== undefined) {
      practitioner.myGigster.taxReservePercentage = Number(taxReservePercentage);
    }

    if (bankName || bsb || accountNumber || accountHolder) {
      practitioner.myGigster.bankDetails = {
        bankName: bankName || practitioner.myGigster.bankDetails.bankName,
        bsb: bsb || practitioner.myGigster.bankDetails.bsb,
        accountNumber: accountNumber || practitioner.myGigster.bankDetails.accountNumber,
        accountHolder: accountHolder || practitioner.myGigster.bankDetails.accountHolder
      };
    }

    await practitioner.save();
    res.status(200).json({ 
      success: true, 
      message: 'myGigster settings updated successfully', 
      data: practitioner.myGigster 
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update myGigster settings', error: err.message });
  }
};
