const express = require('express');
const { getPendingPractitioners, verifyPractitioner, getMarketMetrics, createAdmin } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/practitioners/pending').get(getPendingPractitioners);
router.route('/practitioners/:id/verify').put(verifyPractitioner);
router.route('/metrics').get(getMarketMetrics);
router.route('/users/admin').post(createAdmin);

module.exports = router;
