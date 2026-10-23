const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const ServiceLocation = require('../models/ServiceLocation');
const District = require('../models/District');
const AuditLogger = require('../services/auditLogger');

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

/**
 * Register a new user in Tamil Nadu
 * Rejects self-assigned admin roles and verifies genuine registration input
 */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role, district, cityOrTown, pincode, serviceAddress, tariffCategory, consumerNumber } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, email, and password.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Role security check: Never allow self-registration as admin
    const safeRole = role === 'industry_user' ? 'industry_user' : 'home_user';

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      await AuditLogger.log({
        eventType: 'AUTH_REGISTER_DUPLICATE_ATTEMPT',
        result: 'FAILURE',
        ipAddress: req.ip,
        endpoint: '/api/auth/register',
        metadata: { email: normalizedEmail }
      });

      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: safeRole,
      accountStatus: 'active'
    });

    // Optionally create linked initial Tamil Nadu service location if provided
    let serviceLocation = null;
    if (district) {
      serviceLocation = await ServiceLocation.create({
        userId: user._id,
        state: 'Tamil Nadu',
        district: district.trim(),
        cityOrTown: (cityOrTown || district).trim(),
        pincode: pincode ? pincode.trim() : '600001',
        serviceAddress: (serviceAddress || `${district}, Tamil Nadu`).trim(),
        discom: 'TANGEDCO',
        tariffCategory: ['domestic', 'commercial', 'industrial'].includes(tariffCategory) ? tariffCategory : 'domestic',
        consumerNumberEncrypted: consumerNumber ? consumerNumber.trim() : '',
        verifiedAt: new Date()
      });
    }

    // Generate JWT
    const token = generateToken(user._id, user.role);

    await AuditLogger.log({
      userId: user._id,
      eventType: 'USER_REGISTERED',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/auth/register',
      metadata: { role: user.role, district: district || 'Not specified' }
    });

    res.status(201).json({
      success: true,
      message: 'Account successfully registered.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      },
      serviceLocation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Authenticate user & return token
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      await AuditLogger.log({
        eventType: 'AUTH_LOGIN_FAILED',
        result: 'FAILURE',
        ipAddress: req.ip,
        endpoint: '/api/auth/login',
        metadata: { reason: 'User not found', email: normalizedEmail }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await AuditLogger.log({
        userId: user._id,
        eventType: 'AUTH_LOGIN_FAILED',
        result: 'FAILURE',
        ipAddress: req.ip,
        endpoint: '/api/auth/login',
        metadata: { reason: 'Password mismatch' }
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact support.'
      });
    }

    const token = generateToken(user._id, user.role);

    // Fetch primary service location
    const location = await ServiceLocation.findOne({ userId: user._id });

    await AuditLogger.log({
      userId: user._id,
      eventType: 'AUTH_LOGIN_SUCCESS',
      result: 'SUCCESS',
      ipAddress: req.ip,
      endpoint: '/api/auth/login'
    });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      },
      serviceLocation: location
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    const locations = await ServiceLocation.find({ userId: req.user.id });

    res.json({
      success: true,
      user,
      locations
    });
  } catch (error) {
    next(error);
  }
};
