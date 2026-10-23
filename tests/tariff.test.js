const { test, describe } = require('node:test');
const assert = require('node:assert');
const TariffEngine = require('../backend/src/services/tariffEngine');
const tariffSeedData = require('../backend/src/seed/tariffData.json');

describe('Tamil Nadu TNERC Electricity Tariff Engine Tests', () => {
  const domesticTariff = tariffSeedData.find(t => t.tariffCategory === 'domestic');
  const commercialTariff = tariffSeedData.find(t => t.tariffCategory === 'commercial');

  test('0 to 100 units domestic consumption should be 100% free under TN subsidy', () => {
    const bill = TariffEngine.calculateBill(95, domesticTariff);

    assert.strictEqual(bill.totalUnitsKwh, 95);
    assert.strictEqual(bill.estimatedAmount, 0); // 100% free
    assert.strictEqual(bill.subsidyAmount, bill.grossEnergyCharge);
    assert.strictEqual(bill.fixedCharge, 0); // Waived for <= 100 units
    assert.strictEqual(bill.tariffVersion, 'TNERC-TANGEDCO-2024-V1');
    assert.ok(bill.disclaimer.includes('estimated electricity bill'));
  });

  test('Exactly 100 units domestic consumption should be ₹0.00', () => {
    const bill = TariffEngine.calculateBill(100, domesticTariff);
    assert.strictEqual(bill.estimatedAmount, 0);
  });

  test('180 units domestic consumption should apply 100 free units and subsidized 101-200 rate', () => {
    const bill = TariffEngine.calculateBill(180, domesticTariff);

    assert.strictEqual(bill.totalUnitsKwh, 180);
    // Slab 1: 100 units @ 4.50 = 450, subsidized 4.50 -> 0 net
    // Slab 2: 80 units @ 4.50 = 360, subsidized 2.25 -> 80 * 2.25 = 180 net energy
    // Fixed charge: 30
    // Tax: 5% on 180 = 9.00
    // Total: 180 + 30 + 9.00 = 219.00
    assert.strictEqual(bill.netEnergyCharge, 180);
    assert.strictEqual(bill.fixedCharge, 30);
    assert.strictEqual(bill.taxAmount, 9.00);
    assert.strictEqual(bill.estimatedAmount, 219.00);
  });

  test('Tariff engine handles Commercial category demand and rates', () => {
    const bill = TariffEngine.calculateBill(200, commercialTariff);

    assert.strictEqual(bill.tariffCategory, 'commercial');
    assert.ok(bill.grossEnergyCharge > 0);
    assert.strictEqual(bill.subsidyAmount, 0); // No free units for commercial
    assert.strictEqual(bill.fixedCharge, 120);
    assert.ok(bill.estimatedAmount > bill.netEnergyCharge);
  });

  test('Tariff engine safely handles 0 or negative units gracefully', () => {
    const bill = TariffEngine.calculateBill(-25, domesticTariff);
    assert.strictEqual(bill.totalUnitsKwh, 0);
    assert.strictEqual(bill.estimatedAmount, 0);
  });
});
