const express = require('express');
const router = express.Router();
const { createReview, getPractitionerReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createReview);
router.get('/practitioner/:practitionerId', getPractitionerReviews);

module.exports = router;
