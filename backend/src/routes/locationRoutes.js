const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');

// Public route to get Tamil Nadu districts
router.get('/districts', locationController.getDistricts);

// Protected routes for user's service locations
router.get('/', authenticate, locationController.getMyLocations);
router.post('/', authenticate, locationController.createLocation);
router.patch('/:id', authenticate, locationController.updateLocation);

module.exports = router;
