const AuditLog = require('../models/AuditLog');

class AuditLogger {
  /**
   * Records a security or system event in the database
   */
  static async log({ userId = null, eventType, result = 'SUCCESS', ipAddress = '', endpoint = '', metadata = {} }) {
    try {
      // Ensure no sensitive credentials/passwords leak into audit logs
      const sanitizedMeta = { ...metadata };
      delete sanitizedMeta.password;
      delete sanitizedMeta.passwordHash;
      delete sanitizedMeta.token;
      delete sanitizedMeta.authorization;

      await AuditLog.create({
        userId,
        eventType,
        result,
        ipAddress: ipAddress || '127.0.0.1',
        endpoint,
        metadata: sanitizedMeta,
        timestamp: new Date()
      });
    } catch (err) {
      console.warn('[AuditLogger Error] Could not persist audit log:', err.message);
    }
  }
}

module.exports = AuditLogger;
