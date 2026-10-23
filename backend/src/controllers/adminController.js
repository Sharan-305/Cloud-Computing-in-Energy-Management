const AuditLog = require('../models/AuditLog');
const TariffRate = require('../models/TariffRate');
const User = require('../models/User');
const ServiceLocation = require('../models/ServiceLocation');
const EnergyReading = require('../models/EnergyReading');
const AuditLogger = require('../services/auditLogger');

/**
 * Get system audit logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 50, eventType } = req.query;
    const query = {};
    if (eventType) query.eventType = eventType;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('userId', 'fullName email role')
      .lean();

    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tariff schedules
 */
exports.getTariffVersions = async (req, res, next) => {
  try {
    const tariffs = await TariffRate.find().sort({ effectiveFrom: -1 }).lean();
    res.json({
      success: true,
      count: tariffs.length,
      tariffs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update or insert a tariff rate version (Admin only)
 */
exports.upsertTariff = async (req, res, next) => {
  try {
    const { tariffCode, version, slabs, fixedCharges, taxPercentage, freeUnitsAllowed, sourceOrder } = req.body;

    if (!tariffCode || !version || !slabs) {
      return res.status(400).json({
        success: false,
        message: 'Tariff code, version, and slabs are required.'
      });
    }

    const updated = await TariffRate.findOneAndUpdate(
      { tariffCode, version },
      {
        ...req.body,
        verifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    await AuditLogger.log({
      userId: req.user.id,
      eventType: 'TARIFF_SCHEDULE_UPDATED',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/admin/tariffs',
      metadata: { tariffCode, version }
    });

    res.json({
      success: true,
      message: 'Tariff rate updated successfully.',
      tariff: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * System analytics overview
 */
exports.getSystemStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLocations = await ServiceLocation.countDocuments();
    const totalReadings = await EnergyReading.countDocuments();

    // Group locations by Tamil Nadu district
    const districtBreakdown = await ServiceLocation.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalRegisteredUsers: totalUsers,
        totalServiceLocations: totalLocations,
        totalEnergyReadings: totalReadings,
        districtBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};
