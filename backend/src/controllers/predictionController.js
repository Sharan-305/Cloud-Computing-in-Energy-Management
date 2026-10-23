const UsagePrediction = require('../models/UsagePrediction');
const EnergyReading = require('../models/EnergyReading');
const ServiceLocation = require('../models/ServiceLocation');
const MLForecastBridge = require('../services/mlForecastBridge');
const AuditLogger = require('../services/auditLogger');

/**
 * Generate ML forecast and pattern analysis
 */
exports.generatePrediction = async (req, res, next) => {
  try {
    const { forecastPeriod = 'next_billing_period' } = req.body;

    // Fetch user's historical readings
    const readings = await EnergyReading.find({
      userId: req.user.id,
      qualityStatus: { $ne: 'rejected' }
    })
      .sort({ timestamp: 1 })
      .lean();

    // Determine user's tariff category
    const loc = await ServiceLocation.findOne({ userId: req.user.id });
    const tariffCategory = loc ? loc.tariffCategory : 'domestic';

    // Generate integrated forecast: XGBoost ML + TNERC Tariff Engine
    const forecast = await MLForecastBridge.generateIntegratedForecast(readings, tariffCategory);

    // Persist prediction record in database
    const saved = await UsagePrediction.create({
      userId: req.user.id,
      forecastPeriod: forecastPeriod || 'next_billing_period',
      predictedKwh: forecast.predictedKwh,
      predictedCost: forecast.predictedCost,
      usagePattern: forecast.usagePattern,
      anomalyScore: forecast.anomalyScore,
      anomalyDetected: forecast.anomalyDetected,
      anomalyReason: forecast.anomalyReason,
      confidenceInterval: forecast.confidenceInterval,
      dailyForecasts: forecast.dailyForecasts,
      modelVersion: forecast.modelInfo.modelVersion,
      modelType: forecast.modelInfo.modelType,
      generatedAt: new Date()
    });

    await AuditLogger.log({
      userId: req.user.id,
      eventType: 'PREDICTION_GENERATED',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/predictions/generate',
      metadata: {
        predictedKwh: forecast.predictedKwh,
        predictedCost: forecast.predictedCost,
        usagePattern: forecast.usagePattern,
        isBaseline: forecast.modelInfo.isBaseline
      }
    });

    res.status(201).json({
      success: true,
      message: 'Energy prediction and usage pattern generated successfully.',
      prediction: forecast,
      recordId: saved._id
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get prediction history
 */
exports.getPredictions = async (req, res, next) => {
  try {
    const predictions = await UsagePrediction.find({ userId: req.user.id })
      .sort({ generatedAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      count: predictions.length,
      predictions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get latest prediction
 */
exports.getLatestPrediction = async (req, res, next) => {
  try {
    const latest = await UsagePrediction.findOne({ userId: req.user.id })
      .sort({ generatedAt: -1 })
      .lean();

    res.json({
      success: true,
      prediction: latest
    });
  } catch (error) {
    next(error);
  }
};
