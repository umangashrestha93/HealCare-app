const express = require('express');
const { getPractitioners, getPractitioner } = require('../controllers/practitionerController');
const router = express.Router();

router.route('/').get(getPractitioners);
router.route('/:id').get(getPractitioner);

module.exports = router;
