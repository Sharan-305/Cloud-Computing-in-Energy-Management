const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/estimate', billingController.calculateEstimate);
router.get('/history', billingController.getBillingHistory);
router.get('/:id', billingController.getBillById);

module.exports = router;
