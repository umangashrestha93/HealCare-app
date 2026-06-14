const express = require('express');
const { geocodePostcode } = require('../controllers/geocodeController');

const router = express.Router();

router.get('/postcode/:code', geocodePostcode);

module.exports = router;
