const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');

const devUsers = new Map();

const isMongoConnected = () => mongoose.connection.readyState === 1;
const normalizeEmail = (email) => email.trim().toLowerCase();

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Please provide first name, last name, email and password' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!isMongoConnected()) {
      if (devUsers.has(normalizedEmail)) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const user = {
        _id: crypto.randomUUID(),
        firstName,
        lastName,
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role: role || 'client'
      };
      devUsers.set(normalizedEmail, user);
      return sendTokenResponse(user, 201, res);
    }

    // Check if user exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password,
      role: role || 'client'
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
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
      const user = devUsers.get(normalizedEmail);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
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
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
};
