const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all admin routes with authentication and 'admin' role authorization
router.use(authenticate, authorize('admin'));

router.get('/audit-logs', adminController.getAuditLogs);
router.get('/tariffs', adminController.getTariffVersions);
router.post('/tariffs', adminController.upsertTariff);
router.get('/stats', adminController.getSystemStats);

module.exports = router;
