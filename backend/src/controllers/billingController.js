const BillingRecord = require('../models/BillingRecord');
const ServiceLocation = require('../models/ServiceLocation');
const EnergyReading = require('../models/EnergyReading');
const TariffEngine = require('../services/tariffEngine');
const AuditLogger = require('../services/auditLogger');

/**
 * Calculate estimated electricity bill
 * Can calculate from specified units or by summing readings between start and end date
 */
exports.calculateEstimate = async (req, res, next) => {
  try {
    const { unitsKwh, startDate, endDate, tariffCategory, serviceLocationId, saveRecord = true } = req.body;

    let units = Number(unitsKwh);
    let billingStart = startDate ? new Date(startDate) : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days default (bi-monthly TN cycle)
    let billingEnd = endDate ? new Date(endDate) : new Date();

    // If units not directly provided, sum readings in the date range
    if (isNaN(units) || units <= 0) {
      const readings = await EnergyReading.find({
        userId: req.user.id,
        timestamp: { $gte: billingStart, $lte: billingEnd },
        qualityStatus: { $ne: 'rejected' }
      });

      units = readings.reduce((sum, r) => sum + (r.consumptionKwh || 0), 0);
    }

    // Determine tariff category
    let category = tariffCategory;
    if (!category) {
      const loc = await ServiceLocation.findOne({ userId: req.user.id });
      category = loc ? loc.tariffCategory : 'domestic';
    }

    // Run official TNERC tariff calculation engine
    const calculation = await TariffEngine.estimate(units, category, billingEnd);

    let savedRecord = null;
    if (saveRecord) {
      savedRecord = await BillingRecord.create({
        userId: req.user.id,
        serviceLocationId: serviceLocationId || null,
        billingStart,
        billingEnd,
        totalUnitsKwh: calculation.totalUnitsKwh,
        energyCharge: calculation.grossEnergyCharge,
        subsidyAmount: calculation.subsidyAmount,
        fixedCharge: calculation.fixedCharge,
        taxAmount: calculation.taxAmount,
        adjustments: calculation.adjustments,
        estimatedAmount: calculation.estimatedAmount,
        tariffCategory: calculation.tariffCategory,
        tariffVersion: calculation.tariffVersion,
        calculationType: 'estimate',
        breakdown: calculation.breakdown,
        calculatedAt: new Date()
      });

      await AuditLogger.log({
        userId: req.user.id,
        eventType: 'BILL_ESTIMATED',
        result: 'SUCCESS',
        ipAddress: req.ip,
        endpoint: '/api/billing/estimate',
        metadata: {
          units: calculation.totalUnitsKwh,
          estimatedAmount: calculation.estimatedAmount,
          tariffVersion: calculation.tariffVersion
        }
      });
    }

    res.json({
      success: true,
      estimate: calculation,
      recordId: savedRecord ? savedRecord._id : null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get billing history for authenticated user
 */
exports.getBillingHistory = async (req, res, next) => {
  try {
    const history = await BillingRecord.find({ userId: req.user.id })
      .sort({ calculatedAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific billing record by ID
 */
exports.getBillById = async (req, res, next) => {
  try {
    const bill = await BillingRecord.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: 'Billing record not found.'
      });
    }

    res.json({
      success: true,
      bill
    });
  } catch (error) {
    next(error);
  }
};
