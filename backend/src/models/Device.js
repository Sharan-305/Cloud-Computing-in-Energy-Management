const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
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
    deviceName: {
      type: String,
      required: true,
      trim: true
    },
    deviceType: {
      type: String,
      enum: ['smart_meter', 'solar_inverter', 'iot_gateway', 'sub_meter'],
      default: 'smart_meter'
    },
    deviceIdentifier: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'maintenance'],
      default: 'online'
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1'
    },
    lastReadingKwh: {
      type: Number,
      default: 0
    },
    installedAt: {
      type: Date,
      default: Date.now
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Device', deviceSchema);
