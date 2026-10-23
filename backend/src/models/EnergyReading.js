const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    serviceLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceLocation',
      default: null
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      default: null
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    consumptionKwh: {
      type: Number,
      required: true,
      min: [0, 'Consumption cannot be negative']
    },
    readingSource: {
      type: String,
      enum: ['smart_meter', 'manual', 'simulation', 'iot_gateway'],
      default: 'manual',
      required: true
    },
    qualityStatus: {
      type: String,
      enum: ['valid', 'estimated', 'rejected'],
      default: 'valid'
    },
    meterReadingCumulative: {
      type: Number,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

energyReadingSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('EnergyReading', energyReadingSchema);
