const mongoose = require('mongoose');

const usagePredictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    forecastPeriod: {
      type: String,
      enum: ['next_day', 'next_week', 'next_billing_period'],
      required: true
    },
    predictedKwh: {
      type: Number,
      required: true
    },
    predictedCost: {
      type: Number,
      required: true
    },
    usagePattern: {
      type: String,
      enum: ['stable', 'increasing', 'seasonal', 'irregular', 'peak_heavy'],
      default: 'stable'
    },
    anomalyScore: {
      type: Number,
      default: 0.0
    },
    anomalyDetected: {
      type: Boolean,
      default: false
    },
    anomalyReason: {
      type: String,
      default: ''
    },
    confidenceInterval: {
      lowerKwh: { type: Number, default: 0 },
      upperKwh: { type: Number, default: 0 }
    },
    dailyForecasts: [
      {
        date: { type: String },
        predictedKwh: { type: Number },
        estimatedCostInr: { type: Number }
      }
    ],
    modelVersion: {
      type: String,
      default: 'XGBoost-Regressor-v1.2-TN'
    },
    modelType: {
      type: String,
      default: 'XGBoost with Lag & Rolling Average Features'
    },
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

usagePredictionSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model('UsagePrediction', usagePredictionSchema);
