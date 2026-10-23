const Device = require('../models/Device');
const EnergyReading = require('../models/EnergyReading');
const ServiceLocation = require('../models/ServiceLocation');

exports.getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ userId: req.user.id }).lean();
    res.json({
      success: true,
      count: devices.length,
      devices
    });
  } catch (error) {
    next(error);
  }
};

exports.registerDevice = async (req, res, next) => {
  try {
    const { deviceName, deviceType, deviceIdentifier } = req.body;

    if (!deviceName || !deviceIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Device name and identifier are required.'
      });
    }

    const existing = await Device.findOne({ deviceIdentifier });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A device with this identifier is already registered.'
      });
    }

    const loc = await ServiceLocation.findOne({ userId: req.user.id });

    const device = await Device.create({
      userId: req.user.id,
      serviceLocationId: loc ? loc._id : null,
      deviceName: deviceName.trim(),
      deviceType: deviceType || 'smart_meter',
      deviceIdentifier: deviceIdentifier.trim(),
      status: 'online',
      lastSeenAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Device registered successfully.',
      device
    });
  } catch (error) {
    next(error);
  }
};

exports.simulateTelemetry = async (req, res, next) => {
  try {
    const device = await Device.findOne({ _id: req.params.id, userId: req.user.id });
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found.' });
    }

    // Generate realistic domestic reading (e.g. 3 to 12 kWh)
    const base = device.deviceType === 'solar_inverter' ? 8.5 : 5.8;
    const jitter = (Math.random() * 4 - 2);
    const readingKwh = Math.max(0.5, Number((base + jitter).toFixed(2)));

    const reading = await EnergyReading.create({
      userId: req.user.id,
      serviceLocationId: device.serviceLocationId,
      deviceId: device._id,
      timestamp: new Date(),
      consumptionKwh: readingKwh,
      readingSource: 'smart_meter',
      qualityStatus: 'valid',
      notes: `Telemetry stream from ${device.deviceName} (${device.deviceIdentifier})`
    });

    device.lastReadingKwh = readingKwh;
    device.lastSeenAt = new Date();
    await device.save();

    res.json({
      success: true,
      message: 'Telemetry received from smart meter.',
      reading
    });
  } catch (error) {
    next(error);
  }
};
