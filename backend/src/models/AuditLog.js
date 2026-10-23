const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    ipAddress: {
      type: String,
      default: ''
    },
    endpoint: {
      type: String,
      default: ''
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'WARNING', 'INFO'],
      default: 'SUCCESS'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
