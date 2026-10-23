const mongoose = require('mongoose');

const serviceLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    state: {
      type: String,
      default: 'Tamil Nadu',
      required: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    cityOrTown: {
      type: String,
      required: [true, 'City or Town is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true,
      match: [/^[6][0-4]\d{4}$/, 'Please enter a valid 6-digit Tamil Nadu PIN code (6xxxxx)']
    },
    serviceAddress: {
      type: String,
      required: [true, 'Service address is required'],
      trim: true
    },
    discom: {
      type: String,
      default: 'TANGEDCO',
      required: true
    },
    tariffCategory: {
      type: String,
      enum: ['domestic', 'commercial', 'industrial'],
      default: 'domestic',
      required: true
    },
    consumerNumberEncrypted: {
      type: String,
      trim: true,
      default: ''
    },
    sanctionedLoadKw: {
      type: Number,
      default: 3.0,
      min: 0.5
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ServiceLocation', serviceLocationSchema);
