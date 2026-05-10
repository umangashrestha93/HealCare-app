const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const {
  getPractitioners,
  getPractitioner,
  getMyProfile,
  updateMyProfile,
  uploadDocument
} = require('../controllers/practitionerController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();
const uploadDir = path.resolve(__dirname, '../uploads/compliance');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeDocType = (req.body.docType || 'document').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    cb(null, `${req.user.id}-${safeDocType}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPG, PNG, and WEBP documents are allowed'));
    }
    cb(null, true);
  }
});

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
