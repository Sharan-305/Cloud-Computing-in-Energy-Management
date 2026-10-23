const EnergyReading = require('../models/EnergyReading');
const ServiceLocation = require('../models/ServiceLocation');
const AuditLogger = require('../services/auditLogger');

/**
 * Add a single energy reading
 */
exports.addReading = async (req, res, next) => {
  try {
    const { consumptionKwh, timestamp, readingSource, qualityStatus, serviceLocationId, cumulativeReading, notes } = req.body;

    let kwh = Number(consumptionKwh);

    // If cumulative reading provided, calculate interval usage from previous reading
    if (cumulativeReading !== undefined && (isNaN(kwh) || kwh <= 0)) {
      const prevReading = await EnergyReading.findOne({
        userId: req.user.id,
        meterReadingCumulative: { $ne: null }
      }).sort({ timestamp: -1 });

      if (prevReading && prevReading.meterReadingCumulative !== null) {
        const diff = Number(cumulativeReading) - prevReading.meterReadingCumulative;
        if (diff >= 0) {
          kwh = diff;
        } else {
          // Meter reset or rollover
          kwh = Number(cumulativeReading);
        }
      } else {
        kwh = Number(cumulativeReading);
      }
    }

    if (isNaN(kwh) || kwh < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive consumption in kWh is required.'
      });
    }

    const readingTime = timestamp ? new Date(timestamp) : new Date();

    const reading = await EnergyReading.create({
      userId: req.user.id,
      serviceLocationId: serviceLocationId || null,
      timestamp: readingTime,
      consumptionKwh: Number(kwh.toFixed(3)),
      readingSource: ['smart_meter', 'manual', 'simulation', 'iot_gateway'].includes(readingSource) ? readingSource : 'manual',
      qualityStatus: ['valid', 'estimated', 'rejected'].includes(qualityStatus) ? qualityStatus : 'valid',
      meterReadingCumulative: cumulativeReading !== undefined ? Number(cumulativeReading) : null,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Energy reading recorded successfully.',
      reading
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch ingest multiple readings (e.g. from IoT smart meter, simulation, or CSV import)
 */
exports.batchIngest = async (req, res, next) => {
  try {
    const { readings, readingSource } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'An array of readings is required.'
      });
    }

    const docs = readings.map(r => ({
      userId: req.user.id,
      timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
      consumptionKwh: Math.max(0, Number(r.consumptionKwh) || 0),
      readingSource: readingSource || r.readingSource || 'simulation',
      qualityStatus: r.qualityStatus || 'valid',
      notes: r.notes || ''
    }));

    const inserted = await EnergyReading.insertMany(docs);

    await AuditLogger.log({
      userId: req.user.id,
      eventType: 'ENERGY_READINGS_BATCH_INGESTED',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/energy/readings/batch',
      metadata: { count: inserted.length, source: readingSource || 'batch' }
    });

    res.status(201).json({
      success: true,
      message: `Successfully ingested ${inserted.length} energy readings.`,
      count: inserted.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get readings for authenticated user with date filtering & pagination
 */
exports.getReadings = async (req, res, next) => {
  try {
    const { startDate, endDate, source, limit = 100 } = req.query;

    const query = { userId: req.user.id };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (source) {
      query.readingSource = source;
    }

    const readings = await EnergyReading.find(query)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();

    // Summary statistics
    const totalKwh = readings.reduce((sum, r) => sum + (r.consumptionKwh || 0), 0);
    const avgKwh = readings.length > 0 ? totalKwh / readings.length : 0;

    res.json({
      success: true,
      count: readings.length,
      summary: {
        totalConsumptionKwh: Number(totalKwh.toFixed(2)),
        averageConsumptionKwh: Number(avgKwh.toFixed(2)),
        latestReading: readings[0] || null
      },
      readings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a reading
 */
exports.deleteReading = async (req, res, next) => {
  try {
    const reading = await EnergyReading.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'Reading not found or does not belong to you.'
      });
    }

    res.json({
      success: true,
      message: 'Reading removed.'
    });
  } catch (error) {
    next(error);
  }
};
