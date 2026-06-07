const express = require('express');
const {
  getPractitioners,
  getPendingPractitioners,
  getSinglePractitioner,
  approvePractitioner,
  rejectPractitioner,
  verifyPractitioner,
  getMarketMetrics,
  createAdmin,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAdmins,
  createAdminProfile,
  updateAdminProfile,
  deleteAdminProfile,
  addComplianceNote,
  getComplianceLogs,
  getAdminBookings,
  getSettings,
  updateSettings
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminMiddleware');
const router = express.Router();

router.use(protect);
router.use(adminOnly);

// Practitioner management
// IMPORTANT: static routes MUST come before parameterized /:id routes
router.route('/practitioners/pending').get(getPendingPractitioners);
router.route('/practitioners').get(getPractitioners);
router.route('/practitioners/:id').get(getSinglePractitioner);
router.route('/practitioners/:id/approve').patch(approvePractitioner);
router.route('/practitioners/:id/reject').patch(rejectPractitioner);
router.route('/practitioners/:id/verify').put(verifyPractitioner);
router.route('/practitioners/:id/notes').post(addComplianceNote);

// Metrics & admin management
router.route('/metrics').get(getMarketMetrics);
router.route('/bookings').get(getAdminBookings);
router.route('/users').get(getUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);
router.route('/users/admin').post(createAdmin);
router.route('/admins').get(getAdmins).post(createAdminProfile);
router.route('/admins/:id').put(updateAdminProfile).delete(deleteAdminProfile);
router.route('/compliance-logs').get(getComplianceLogs);
router.route('/settings').get(getSettings).put(updateSettings);

module.exports = router;
