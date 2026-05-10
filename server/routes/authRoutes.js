const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  getUserById,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.get('/user/:id', protect, getUserById);
router.put('/profile', protect, updateProfile);

module.exports = router;
