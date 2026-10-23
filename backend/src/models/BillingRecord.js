const mongoose = require('mongoose');

const billingRecordSchema = new mongoose.Schema(
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
    billingStart: {
      type: Date,
      required: true
    },
    billingEnd: {
      type: Date,
      required: true
    },
    totalUnitsKwh: {
      type: Number,
      required: true
    },
    energyCharge: {
      type: Number,
      required: true
    },
    subsidyAmount: {
      type: Number,
      default: 0
    },
    fixedCharge: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    adjustments: {
      type: Number,
      default: 0
    },
    estimatedAmount: {
      type: Number,
      required: true
    },
    tariffCategory: {
      type: String,
      default: 'domestic'
    },
    tariffVersion: {
      type: String,
      required: true
    },
    calculationType: {
      type: String,
      enum: ['estimate', 'reconciled_bill'],
      default: 'estimate'
    },
    breakdown: {
      type: Array,
      default: []
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

billingRecordSchema.index({ userId: 1, calculatedAt: -1 });

module.exports = mongoose.model('BillingRecord', billingRecordSchema);
