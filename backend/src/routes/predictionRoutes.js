const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');
const { authenticate } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);

router.post('/generate', apiLimiter, predictionController.generatePrediction);
router.get('/', predictionController.getPredictions);
router.get('/latest', predictionController.getLatestPrediction);

module.exports = router;
