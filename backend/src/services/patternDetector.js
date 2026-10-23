/**
 * Usage Pattern Identification and Anomaly Detection Service
 * Analyzes historical series of energy consumption readings.
 */
class PatternDetector {
  /**
   * Identifies consumption pattern and checks for anomalies
   * @param {Array<{timestamp: Date|string, consumptionKwh: number}>} readings
   */
  static analyze(readings = []) {
    if (!readings || readings.length === 0) {
      return {
        usagePattern: 'stable',
        anomalyDetected: false,
        anomalyScore: 0,
        anomalyReason: 'Insufficient readings history',
        metrics: {
          mean: 0,
          stdDev: 0,
          min: 0,
          max: 0,
          sampleCount: 0
        }
      };
    }

    // Sort chronologically
    const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const values = sorted.map(r => Number(r.consumptionKwh) || 0);
    const n = values.length;

    // Basic statistical metrics
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const cv = mean > 0 ? stdDev / mean : 0; // Coefficient of variation

    // 1. Trend calculation (Linear regression slope)
    let slope = 0;
    if (n >= 4) {
      const xMean = (n - 1) / 2;
      let numerator = 0;
      let denominator = 0;
      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - mean);
        denominator += Math.pow(i - xMean, 2);
      }
      slope = denominator !== 0 ? numerator / denominator : 0;
    }

    // 2. Pattern Classification
    let usagePattern = 'stable';
    if (n < 5) {
      usagePattern = 'stable'; // Baseline for sparse records
    } else if (slope > 0.08 * mean) {
      usagePattern = 'increasing';
    } else if (cv > 0.45) {
      usagePattern = 'irregular';
    } else if (this.isSeasonalPeak(sorted)) {
      usagePattern = 'seasonal';
    } else if (cv <= 0.22) {
      usagePattern = 'stable';
    } else {
      usagePattern = 'peak_heavy';
    }

    // 3. Anomaly Detection on the most recent reading against prior baseline
    const latest = values[values.length - 1];
    let anomalyDetected = false;
    let anomalyScore = 0;
    let anomalyReason = '';

    if (n >= 5) {
      const priorValues = values.slice(0, -1);
      const priorSum = priorValues.reduce((acc, v) => acc + v, 0);
      const priorMean = priorSum / priorValues.length;
      const priorVar = priorValues.reduce((acc, v) => acc + Math.pow(v - priorMean, 2), 0) / (priorValues.length - 1);
      const priorStd = Math.sqrt(priorVar) || (priorMean * 0.1);

      const zScore = priorStd > 0 ? (latest - priorMean) / priorStd : 0;
      anomalyScore = Number(Math.abs(zScore).toFixed(2));

      if ((zScore > 2.5 && Math.abs(latest - priorMean) > 0.35 * priorMean) || (priorMean > 0 && latest > 2.0 * priorMean && latest >= 10)) {
        anomalyDetected = true;
        anomalyReason = `Current reading of ${latest.toFixed(1)} kWh is abnormally high (+${anomalyScore} std dev above baseline of ${priorMean.toFixed(1)} kWh)`;
      } else if (zScore < -2.5 && latest === 0) {
        anomalyDetected = true;
        anomalyReason = `Reading dropped to 0 kWh unexpectedly. Check power interruption or meter sensor.`;
      }
    }

    return {
      usagePattern,
      anomalyDetected,
      anomalyScore,
      anomalyReason,
      metrics: {
        mean: Number(mean.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
        coefficientOfVariation: Number(cv.toFixed(2)),
        trendSlope: Number(slope.toFixed(3)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        sampleCount: n
      }
    };
  }

  /**
   * Checks if readings correlate with Tamil Nadu seasonal cooling spikes (April - June)
   */
  static isSeasonalPeak(readings) {
    let summerCount = 0;
    let summerSum = 0;
    let otherCount = 0;
    let otherSum = 0;

    for (const r of readings) {
      const month = new Date(r.timestamp).getMonth(); // 0-indexed: 3=April, 4=May, 5=June
      const val = Number(r.consumptionKwh) || 0;
      if (month >= 3 && month <= 5) {
        summerCount++;
        summerSum += val;
      } else {
        otherCount++;
        otherSum += val;
      }
    }

    if (summerCount > 0 && otherCount > 0) {
      const summerAvg = summerSum / summerCount;
      const otherAvg = otherSum / otherCount;
      return summerAvg > otherAvg * 1.35; // 35% higher in summer indicates seasonal air-conditioning load
    }

    return false;
  }
}

module.exports = PatternDetector;
