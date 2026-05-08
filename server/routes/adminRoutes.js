const express = require('express');
const {
  getPractitioners,
  getPendingPractitioners,
  getSinglePractitioner,
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

// Practitioner management
router.route('/practitioners').get(getPractitioners);
router.route('/practitioners/:id').get(getSinglePractitioner);
router.route('/practitioners/:id/approve').patch(approvePractitioner);
router.route('/practitioners/:id/reject').patch(rejectPractitioner);

// Backward-compatible routes
router.route('/practitioners/pending').get(getPendingPractitioners);
router.route('/practitioners/:id/verify').put(verifyPractitioner);

// Metrics & admin management
router.route('/metrics').get(getMarketMetrics);
router.route('/users/admin').post(createAdmin);

module.exports = router;
