const TariffRate = require('../models/TariffRate');
const tariffSeedData = require('../seed/tariffData.json');

/**
 * Tamil Nadu Electricity Regulatory Commission (TNERC) Tariff Calculation Engine
 * Applies official TANGEDCO Low-Tension (LT) tariff orders, slabs, subsidies, and electricity duties.
 */
class TariffEngine {
  /**
   * Fetches active tariff schedule for the category or falls back to verified seed reference
   */
  static async getActiveTariff(category = 'domestic', date = new Date()) {
    try {
      const tariff = await TariffRate.findOne({
        tariffCategory: category.toLowerCase(),
        isActive: true,
        effectiveFrom: { $lte: date },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gte: date } }]
      }).lean();

      if (tariff) return tariff;
    } catch (err) {
      console.warn('[TariffEngine] DB query fallback to local verified dataset:', err.message);
    }

    // Fallback to verified local TNERC dataset
    const local = tariffSeedData.find(t => t.tariffCategory === category.toLowerCase());
    return local || tariffSeedData[0];
  }

  /**
   * Calculates net estimated bill from units consumed
   * Formula: Net Estimated Bill = Energy Charges + Fixed Charges + Taxes/Duties - Subsidies
   */
  static calculateBill(units, tariff, options = {}) {
    const consumption = Math.max(0, Number(units) || 0);
    const billingCycle = tariff.billingCycle || 'bi-monthly';
    const category = tariff.tariffCategory || 'domestic';
    const slabs = tariff.slabs || [];
    const taxRate = tariff.taxPercentage || 5.0;

    let totalGrossEnergyCharge = 0;
    let totalSubsidy = 0;
    let unitsRemaining = consumption;
    const slabBreakdown = [];

    // Progressive slab calculation
    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      const min = slab.minUnits;
      const max = slab.maxUnits !== null ? slab.maxUnits : Infinity;
      const slabCapacity = max - min;

      if (consumption > min) {
        const unitsInThisSlab = Math.min(unitsRemaining, slabCapacity);
        const slabGross = unitsInThisSlab * slab.ratePerUnit;
        const slabSub = unitsInThisSlab * (slab.subsidyPerUnit || 0);
        const slabNet = slabGross - slabSub;

        slabBreakdown.push({
          slabName: slab.slabName,
          units: Number(unitsInThisSlab.toFixed(2)),
          ratePerUnit: slab.ratePerUnit,
          subsidyPerUnit: slab.subsidyPerUnit || 0,
          grossCharge: Number(slabGross.toFixed(2)),
          subsidyAmount: Number(slabSub.toFixed(2)),
          netCharge: Number(slabNet.toFixed(2))
        });

        totalGrossEnergyCharge += slabGross;
        totalSubsidy += slabSub;
        unitsRemaining -= unitsInThisSlab;

        if (unitsRemaining <= 0) break;
      }
    }

    // Special Tamil Nadu Domestic 100 free units scheme validation
    if (category === 'domestic' && consumption <= 100) {
      totalSubsidy = totalGrossEnergyCharge; // Completely free
    }

    const netEnergyCharge = Math.max(0, totalGrossEnergyCharge - totalSubsidy);

    // Fixed charges (domestic bi-monthly fixed charge is waived for <= 100 units)
    let fixedCharge = typeof tariff.fixedCharges === 'number' ? tariff.fixedCharges : 0;
    if (category === 'domestic' && consumption <= 100) {
      fixedCharge = 0.0;
    }

    // Electricity Duty / Tax (5% on net energy charges)
    const taxAmount = Number(((netEnergyCharge * taxRate) / 100).toFixed(2));
    const adjustments = 0.0;

    // Total estimated payable amount
    const netEstimatedAmount = Number((netEnergyCharge + fixedCharge + taxAmount + adjustments).toFixed(2));

    return {
      totalUnitsKwh: Number(consumption.toFixed(2)),
      tariffCategory: category,
      tariffCode: tariff.tariffCode,
      tariffVersion: tariff.version,
      billingCycle,
      sourceOrder: tariff.sourceOrder,
      calculationType: 'estimate',
      grossEnergyCharge: Number(totalGrossEnergyCharge.toFixed(2)),
      subsidyAmount: Number(totalSubsidy.toFixed(2)),
      netEnergyCharge: Number(netEnergyCharge.toFixed(2)),
      fixedCharge: Number(fixedCharge.toFixed(2)),
      taxRatePercentage: taxRate,
      taxAmount,
      adjustments,
      estimatedAmount: netEstimatedAmount,
      currency: 'INR',
      breakdown: slabBreakdown,
      disclaimer: 'This is an estimated electricity bill calculation under official TNERC tariff rules. Official bills are issued by TANGEDCO.',
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * High-level estimation method
   */
  static async estimate(units, category = 'domestic', date = new Date()) {
    const tariff = await this.getActiveTariff(category, date);
    return this.calculateBill(units, tariff);
  }
}

module.exports = TariffEngine;
