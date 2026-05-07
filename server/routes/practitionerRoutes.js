const express = require('express');
const multer = require('multer');
const {
  getPractitioners,
  getPractitioner,
  getMyProfile,
  updateMyProfile,
  uploadDocument
} = require('../controllers/practitionerController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/').get(getPractitioners);
router
  .route('/profile')
  .get(protect, authorize('practitioner'), getMyProfile)
  .put(protect, authorize('practitioner'), updateMyProfile);
router
  .route('/upload')
  .post(protect, authorize('practitioner'), upload.single('document'), uploadDocument);
router.route('/:id').get(getPractitioner);

module.exports = router;
