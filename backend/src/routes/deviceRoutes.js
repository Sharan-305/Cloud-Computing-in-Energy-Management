const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', deviceController.getDevices);
router.post('/', deviceController.registerDevice);
router.post('/:id/telemetry', deviceController.simulateTelemetry);

module.exports = router;
