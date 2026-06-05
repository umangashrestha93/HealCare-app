const express = require('express');
const {
  createEnquiry,
  getMyEnquiries,
  getAllEnquiries
} = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(protect, authorize('client'), createEnquiry)
  .get(protect, authorize('client'), getMyEnquiries);

router
  .route('/admin')
  .get(protect, authorize('admin'), getAllEnquiries);

module.exports = router;
