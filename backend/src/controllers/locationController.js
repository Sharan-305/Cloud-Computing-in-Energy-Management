const District = require('../models/District');
const ServiceLocation = require('../models/ServiceLocation');
const AuditLogger = require('../services/auditLogger');
const districtsSeedData = require('../seed/districtsData.json');

/**
 * Get all 38 Tamil Nadu districts master data
 */
exports.getDistricts = async (req, res, next) => {
  try {
    let districts = await District.find({ isActive: true }).sort({ districtName: 1 }).lean();
    if (!districts || districts.length === 0) {
      districts = districtsSeedData;
    }

    res.json({
      success: true,
      count: districts.length,
      state: 'Tamil Nadu',
      districts
    });
  } catch (error) {
    // If DB disconnected or empty, fallback to seeded json
    res.json({
      success: true,
      count: districtsSeedData.length,
      state: 'Tamil Nadu',
      districts: districtsSeedData
    });
  }
};

/**
 * Get service locations for logged-in user
 */
exports.getMyLocations = async (req, res, next) => {
  try {
    const locations = await ServiceLocation.find({ userId: req.user.id });
    res.json({
      success: true,
      count: locations.length,
      locations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new service location for user
 */
exports.createLocation = async (req, res, next) => {
  try {
    const { district, cityOrTown, pincode, serviceAddress, tariffCategory, consumerNumber, sanctionedLoadKw } = req.body;

    if (!district || !serviceAddress) {
      return res.status(400).json({
        success: false,
        message: 'District and service address are required.'
      });
    }

    const location = await ServiceLocation.create({
      userId: req.user.id,
      state: 'Tamil Nadu',
      district: district.trim(),
      cityOrTown: (cityOrTown || district).trim(),
      pincode: pincode ? pincode.trim() : '600001',
      serviceAddress: serviceAddress.trim(),
      discom: 'TANGEDCO',
      tariffCategory: ['domestic', 'commercial', 'industrial'].includes(tariffCategory) ? tariffCategory : 'domestic',
      consumerNumberEncrypted: consumerNumber ? consumerNumber.trim() : '',
      sanctionedLoadKw: Number(sanctionedLoadKw) || 3.0,
      verifiedAt: new Date()
    });

    await AuditLogger.log({
      userId: req.user.id,
      eventType: 'SERVICE_LOCATION_CREATED',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/locations',
      metadata: { district, tariffCategory }
    });

    res.status(201).json({
      success: true,
      message: 'Tamil Nadu service location added successfully.',
      location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update service location
 */
exports.updateLocation = async (req, res, next) => {
  try {
    const location = await ServiceLocation.findOne({ _id: req.params.id, userId: req.user.id });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Service location not found or does not belong to you.'
      });
    }

    const updatable = ['district', 'cityOrTown', 'pincode', 'serviceAddress', 'tariffCategory', 'consumerNumberEncrypted', 'sanctionedLoadKw'];
    updatable.forEach(field => {
      if (req.body[field] !== undefined) {
        location[field] = req.body[field];
      }
    });

    await location.save();

    res.json({
      success: true,
      message: 'Service location updated.',
      location
    });
  } catch (error) {
    next(error);
  }
};
