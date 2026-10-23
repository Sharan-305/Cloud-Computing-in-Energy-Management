const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema(
  {
    stateCode: {
      type: String,
      default: 'TN',
      required: true
    },
    stateName: {
      type: String,
      default: 'Tamil Nadu',
      required: true
    },
    districtName: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    districtCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    headquarters: {
      type: String,
      default: ''
    },
    pincodes: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    },
    source: {
      type: String,
      default: 'Official Tamil Nadu Revenue & Postal Reference'
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

module.exports = mongoose.model('District', districtSchema);
