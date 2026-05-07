const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const devUserStore = require('../utils/devUserStore');

// Verify JWT Token
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (mongoose.connection.readyState === 1) {
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
    } else {
      const user = await devUserStore.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      req.user = { ...user, id: user._id || user.id };
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Role-Based Access Control (RBAC)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};
