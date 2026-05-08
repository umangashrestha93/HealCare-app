const express = require('express');
const {
  getPractitioners,
  getPendingPractitioners,
  approvePractitioner,
  rejectPractitioner,
  verifyPractitioner,
  getMarketMetrics,
  createAdmin
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminMiddleware');
const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.route('/practitioners').get(getPractitioners);
router.route('/practitioners/:id/approve').patch(approvePractitioner);
router.route('/practitioners/:id/reject').patch(rejectPractitioner);

// Backward-compatible admin routes.
router.route('/practitioners/pending').get(getPendingPractitioners);
router.route('/practitioners/:id/verify').put(verifyPractitioner);

router.route('/metrics').get(getMarketMetrics);
router.route('/users/admin').post(createAdmin);

module.exports = router;
