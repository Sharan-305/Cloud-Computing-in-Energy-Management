require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tn_energy_management',
  JWT_SECRET: process.env.JWT_SECRET || 'tn_energy_jwt_super_secret_key_2026_secured',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  PYTHON_PATH: process.env.PYTHON_PATH || 'python'
};
