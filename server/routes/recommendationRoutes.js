const express = require('express');
const { getRecommendedPractitioners } = require('../controllers/recommendationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/practitioners', protect, authorize('client'), getRecommendedPractitioners);

module.exports = router;
