const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Practitioner = require('../models/Practitioner');
const devUserStore = require('../utils/devUserStore');

const ALLOWED_REGISTRATION_ROLES = ['client', 'practitioner', 'admin'];
const isMongoConnected = () => mongoose.connection.readyState === 1;
const normalizeEmail = (email) => email.trim().toLowerCase();
const getRegistrationRole = (role = 'client') => (
  ALLOWED_REGISTRATION_ROLES.includes(role) ? role : null
);

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      location,
      password,
      role,
      practitionerProfile
    } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide first name, last name, email and password' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isMongoConnected()) {
      const existingDevUser = await devUserStore.findByEmail(normalizedEmail);
      if (existingDevUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Security Guard: Prevent unauthorized admin creation
      let finalRole = getRegistrationRole(role);
      if (!finalRole) {
        return res.status(400).json({ message: 'Invalid account role selected' });
      }

      if (role === 'admin') {
        const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_KEY || 'beyond5_secret_2026';
        if (req.body.adminSecret !== ADMIN_SECRET) {
          return res.status(403).json({ message: 'Invalid Admin Secret Key' });
        }
        finalRole = 'admin';
      }

      const user = {
        _id: crypto.randomUUID(),
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        location,
        password: await bcrypt.hash(password, 10),
        role: finalRole,
        practitionerProfile: finalRole === 'practitioner' ? practitionerProfile : undefined
      };
      await devUserStore.upsertUser(user);
      return sendTokenResponse(user, 201, res);
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Security Guard: Prevent unauthorized admin creation
    let finalRole = getRegistrationRole(role);
    if (!finalRole) {
      return res.status(400).json({ message: 'Invalid account role selected' });
    }

    if (role === 'admin') {
      const ADMIN_SECRET = process.env.ADMIN_REGISTRATION_KEY || 'beyond5_secret_2026';
      if (req.body.adminSecret !== ADMIN_SECRET) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key' });
      }
      finalRole = 'admin';
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      location,
      password,
      role: finalRole
    });

    // Create practitioner profile if needed (don't fail registration if this fails)
    if (user.role === 'practitioner') {
      try {
        await upsertPractitionerProfile(user._id, practitionerProfile || {});
      } catch (profileErr) {
        console.warn('Failed to create practitioner profile, but user was created:', profileErr.message);
        // Continue with registration - profile can be created later
      }
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
  console.error("REGISTER ERROR:");
  console.error(err);

  res.status(500).json({
    message: 'Registration failed',
    error: err.message
  });
}
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      const user = await devUserStore.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json({
        success: true,
        user: sanitizeUser(user),
        practitionerProfile: user.practitionerProfile || null
      });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const practitionerProfile = user.role === 'practitioner'
      ? await Practitioner.findOne({ userId: user._id }).lean()
      : null;

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      practitionerProfile
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load profile', error: err.message });
  }
};

// @desc    Get user by ID
// @route   GET /api/auth/user/:id
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!isMongoConnected()) {
      const user = await devUserStore.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.status(200).json({
        success: true,
        user: sanitizeUser(user)
      });
    }

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      success: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const allowedUserFields = ['firstName', 'lastName', 'phone', 'location'];
    const userUpdates = {};
    allowedUserFields.forEach((field) => {
      if (req.body[field] !== undefined) userUpdates[field] = req.body[field];
    });

    if (!isMongoConnected()) {
      const user = await devUserStore.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const updatedUser = {
        ...user,
        ...userUpdates,
        practitionerProfile: req.body.practitionerProfile || user.practitionerProfile
      };
      await devUserStore.upsertUser(updatedUser);
      return res.status(200).json({
        success: true,
        user: sanitizeUser(updatedUser),
        practitionerProfile: updatedUser.practitionerProfile || null
      });
    }

    const user = await User.findByIdAndUpdate(req.user.id, userUpdates, {
      new: true,
      runValidators: true
    });

    let practitionerProfile = null;
    if (user.role === 'practitioner' && req.body.practitionerProfile) {
      practitionerProfile = await upsertPractitionerProfile(user._id, req.body.practitionerProfile);
    }

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      practitionerProfile
    });
  } catch (err) {
    res.status(500).json({ message: 'Profile update failed', error: err.message });
  }
};

// @desc    Create password reset token
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Please provide an email address' });

    const normalizedEmail = normalizeEmail(email);
    const resetToken = crypto.randomBytes(24).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    if (!isMongoConnected()) {
      const devUser = await devUserStore.findByEmail(normalizedEmail);
      if (devUser) {
        devUser.resetPasswordToken = hashedToken;
        devUser.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
        await devUserStore.upsertUser(devUser);
      }
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link has been prepared.',
        devResetToken: devUser ? resetToken : undefined
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (user) {
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
      await user.save({ validateBeforeSave: false });
      console.log(`Password reset token for ${normalizedEmail}: ${resetToken}`);
    }

    res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been prepared.'
    });
  } catch (err) {
    res.status(500).json({ message: 'Password reset request failed', error: err.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Please provide a new password' });

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    if (!isMongoConnected()) {
      const user = await devUserStore.findByResetToken(hashedToken);
      if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await devUserStore.upsertUser(user);
      return sendTokenResponse(user, 200, res);
    }

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: 'Password reset failed', error: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check for email and password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide an email and password' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isMongoConnected()) {
      const user = await devUserStore.findByEmail(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (user.deletedAt || user.status === 'suspended') {
        return res.status(403).json({ message: 'This account is not active. Please contact support.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      return sendTokenResponse(user, 200, res);
    }

    // 2. Check for user
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.deletedAt || user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is not active. Please contact support.' });
    }

    // 3. Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const access_token = jwt.sign(
    { id: user._id, role: user.role }, 
    process.env.JWT_SECRET || 'secret', 
    { expiresIn: '30d' }
  );

  res.status(statusCode).json({
    success: true,
    access_token,
    isPractitioner: user.role === 'practitioner',
    isAdmin: user.role === 'admin',
    user: {
      ...sanitizeUser(user)
    }
  });
};

const sanitizeUser = (user) => ({
  id: user._id || user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  location: user.location,
  role: user.role
});

const upsertPractitionerProfile = async (userId, profile) => {
  const complianceDocs = Array.isArray(profile.complianceDocs)
    ? profile.complianceDocs.map((doc) => ({
        docType: doc.docType || doc.label || 'Unknown Document',
        url: doc.url || 'pending-upload',
        status: doc.status || 'pending',
        expiryDate: doc.expiryDate
      }))
    : [];

  return Practitioner.findOneAndUpdate(
    { userId },
    {
      userId,
      discipline: profile.discipline || 'Other',
      specializations: profile.specializations || [],
      bio: profile.bio,
      yearsExp: profile.yearsExp,
      abn: profile.abn,
      gender: profile.gender,
      location: profile.location,
      postcode: profile.postcode,
      travelArea: profile.travelArea,
      travelsToPostcodes: Array.isArray(profile.travelsToPostcodes)
        ? profile.travelsToPostcodes
        : String(profile.travelsToPostcodes || '').split(',').map((item) => item.trim()).filter(Boolean),
      mobile: Boolean(profile.mobile),
      fundingOptions: Array.isArray(profile.fundingOptions) ? profile.fundingOptions : [],
      sploseStatus: profile.sploseStatus,
      telehealth: Boolean(profile.telehealth),
      afterHours: Boolean(profile.afterHours),
      weekends: Boolean(profile.weekends),
      complianceDocs
    },
    { upsert: true, new: true, runValidators: true }
  );
};
