const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const { connectDB, getDBStatus } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const energyRoutes = require('./routes/energyRoutes');
const billingRoutes = require('./routes/billingRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false // Allows loading Chart.js CDN in frontend
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve frontend static files
const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    project: 'Cloud Computing in Energy Management (Tamil Nadu)',
    version: '1.0.0',
    database: getDBStatus(),
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to frontend index for client routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Start server
if (config.NODE_ENV !== 'test') {
  connectDB();
  app.listen(config.PORT, () => {
    console.log(`=======================================================`);
    console.log(` Tamil Nadu Energy Management System is running!`);
    console.log(` Port: ${config.PORT}`);
    console.log(` Health: http://localhost:${config.PORT}/api/health`);
    console.log(` Web UI: http://localhost:${config.PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
