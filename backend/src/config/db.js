const mongoose = require('mongoose');
const config = require('./config');

let isConnected = false;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Could not connect to MongoDB: ${error.message}`);
    console.warn(`[Database Notice] Please provide a valid MongoDB Atlas connection string in backend/.env: MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tn_energy_management`);
    isConnected = false;
  }
};

const getDBStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    status: ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'][mongoose.connection.readyState] || 'Unknown'
  };
};

module.exports = { connectDB, getDBStatus };
