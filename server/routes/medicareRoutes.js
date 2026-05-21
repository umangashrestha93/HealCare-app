const express = require('express');
const { getMyMedicareOffer, verifyMedicareCard } = require('../controllers/medicareController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('client'));

router.get('/offer', getMyMedicareOffer);
router.post('/verify', verifyMedicareCard);

module.exports = router;
