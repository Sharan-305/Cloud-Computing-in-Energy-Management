const { test, describe } = require('node:test');
const assert = require('node:assert');
const PatternDetector = require('../backend/src/services/patternDetector');

describe('Energy Usage Pattern Detection & Anomaly Identification Tests', () => {
  test('Classifies stable baseline consumption when variance is low', () => {
    const readings = [
      { timestamp: '2026-05-01', consumptionKwh: 6.0 },
      { timestamp: '2026-05-02', consumptionKwh: 6.2 },
      { timestamp: '2026-05-03', consumptionKwh: 5.9 },
      { timestamp: '2026-05-04', consumptionKwh: 6.1 },
      { timestamp: '2026-05-05', consumptionKwh: 6.0 },
      { timestamp: '2026-05-06', consumptionKwh: 6.3 }
    ];

    const result = PatternDetector.analyze(readings);
    assert.strictEqual(result.usagePattern, 'stable');
    assert.strictEqual(result.anomalyDetected, false);
    assert.ok(result.metrics.coefficientOfVariation < 0.25);
  });

  test('Classifies increasing consumption trend when units continuously ramp up', () => {
    const readings = [
      { timestamp: '2026-05-01', consumptionKwh: 5.0 },
      { timestamp: '2026-05-02', consumptionKwh: 6.5 },
      { timestamp: '2026-05-03', consumptionKwh: 8.0 },
      { timestamp: '2026-05-04', consumptionKwh: 10.0 },
      { timestamp: '2026-05-05', consumptionKwh: 12.0 },
      { timestamp: '2026-05-06', consumptionKwh: 14.5 }
    ];

    const result = PatternDetector.analyze(readings);
    assert.strictEqual(result.usagePattern, 'increasing');
  });

  test('Detects sharp anomaly when a reading spikes abnormally', () => {
    const readings = [
      { timestamp: '2026-05-01', consumptionKwh: 5.0 },
      { timestamp: '2026-05-02', consumptionKwh: 5.2 },
      { timestamp: '2026-05-03', consumptionKwh: 5.1 },
      { timestamp: '2026-05-04', consumptionKwh: 4.9 },
      { timestamp: '2026-05-05', consumptionKwh: 5.0 },
      { timestamp: '2026-05-06', consumptionKwh: 28.5 } // Sudden abnormal spike
    ];

    const result = PatternDetector.analyze(readings);
    assert.strictEqual(result.anomalyDetected, true);
    assert.ok(result.anomalyScore > 2.0);
    assert.ok(result.anomalyReason.includes('abnormally high'));
  });

  test('Gracefully handles empty or single reading', () => {
    const result = PatternDetector.analyze([]);
    assert.strictEqual(result.usagePattern, 'stable');
    assert.strictEqual(result.anomalyDetected, false);
  });
});
