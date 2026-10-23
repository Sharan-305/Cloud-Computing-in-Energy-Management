const mongoose = require('mongoose');

const slabSchema = new mongoose.Schema(
  {
    slabName: { type: String, required: true },
    minUnits: { type: Number, required: true },
    maxUnits: { type: Number, default: null }, // null means infinity / above
    ratePerUnit: { type: Number, required: true },
    subsidyPerUnit: { type: Number, default: 0 }
  },
  { _id: false }
);

const tariffRateSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      default: 'Tamil Nadu',
      required: true
    },
    discom: {
      type: String,
      default: 'TANGEDCO',
      required: true
    },
    tariffCategory: {
      type: String,
      enum: ['domestic', 'commercial', 'industrial'],
      required: true
    },
    tariffCode: {
      type: String,
      required: true // e.g. "LT-1A" for Domestic, "LT-IIIA" for Commercial, "LT-IIIB" for Industrial
    },
    billingCycle: {
      type: String,
      enum: ['bi-monthly', 'monthly'],
      default: 'bi-monthly'
    },
    effectiveFrom: {
      type: Date,
      required: true
    },
    effectiveTo: {
      type: Date,
      default: null
    },
    slabs: [slabSchema],
    fixedCharges: {
      type: mongoose.Schema.Types.Mixed,
      default: 0 // Can be a flat number or tiered object
    },
    freeUnitsAllowed: {
      type: Number,
      default: 100 // 100 units free per bi-monthly cycle for domestic consumers in TN
    },
    taxPercentage: {
      type: Number,
      default: 5.0 // Tamil Nadu Electricity Duty / Tax %
    },
    subsidyRules: {
      type: [String],
      default: ['Tamil Nadu Free 100 Units Scheme (G.O.Ms.No.27, Energy Department)']
    },
    sourceOrder: {
      type: String,
      default: 'TNERC Comprehensive Tariff Order & TANGEDCO LT Tariff Guidelines'
    },
    version: {
      type: String,
      required: true // e.g. "TNERC-TANGEDCO-2024-V1"
    },
    isActive: {
      type: Boolean,
      default: true
    },
    verifiedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TariffRate', tariffRateSchema);
