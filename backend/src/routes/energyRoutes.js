const express = require('express');
const router = express.Router();
const energyController = require('../controllers/energyController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/readings', apiLimiter, energyController.addReading);
router.post('/readings/batch', apiLimiter, energyController.batchIngest);
router.get('/readings', energyController.getReadings);
router.delete('/readings/:id', energyController.deleteReading);

module.exports = router;
