const express = require('express');
const { getPendingPractitioners, verifyPractitioner, getMarketMetrics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/practitioners/pending').get(getPendingPractitioners);
router.route('/practitioners/:id/verify').put(verifyPractitioner);
router.route('/metrics').get(getMarketMetrics);

module.exports = router;
