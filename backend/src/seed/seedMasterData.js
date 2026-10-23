const mongoose = require('mongoose');
const config = require('../config/config');
const District = require('../models/District');
const TariffRate = require('../models/TariffRate');

const districtsData = require('./districtsData.json');
const tariffData = require('./tariffData.json');

const seedMasterData = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('[Seed] Connected to database.');

    // 1. Seed Districts (Tamil Nadu 38 districts master reference)
    console.log(`[Seed] Seeding ${districtsData.length} Tamil Nadu districts...`);
    for (const dist of districtsData) {
      await District.findOneAndUpdate(
        { districtCode: dist.districtCode },
        {
          stateCode: 'TN',
          stateName: 'Tamil Nadu',
          districtName: dist.districtName,
          districtCode: dist.districtCode,
          headquarters: dist.headquarters,
          pincodes: dist.pincodes,
          isActive: true,
          source: 'Government of Tamil Nadu Official Postal & Revenue Reference',
          verifiedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed] Tamil Nadu district reference data successfully seeded.');

    // 2. Seed Official TNERC Tariff Rules
    console.log(`[Seed] Seeding ${tariffData.length} TNERC tariff rate schedules...`);
    for (const tariff of tariffData) {
      await TariffRate.findOneAndUpdate(
        { tariffCode: tariff.tariffCode, version: tariff.version },
        { ...tariff, verifiedAt: new Date() },
        { upsert: true, new: true }
      );
    }
    console.log('[Seed] TNERC tariff rate master rules successfully seeded.');

    console.log('[Seed Complete] Master reference datasets populated.');
    console.log('NOTE: In accordance with project requirements, no demo/default user accounts were seeded. Genuine user registration is active.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed master data:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  seedMasterData();
}

module.exports = seedMasterData;
