# Cloud Computing in Energy Management: Tamil Nadu User Database, Electricity Cost Estimation, and Energy Usage Prediction

A production-ready web application for electricity consumption monitoring, transparent bill estimation based on official **Tamil Nadu Electricity Regulatory Commission (TNERC)** tariff orders, usage pattern identification, and future energy demand forecasting using **XGBoost**.

---

## 🌟 Key Features

1. **Genuine User Registration:** Real user registration across all 38 districts of Tamil Nadu (Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli, Tirunelveli, etc.) with secure bcrypt password hashing and JWT sessions. No demo accounts or default credentials.
2. **Official TNERC Tariff Calculation Engine:** Implements TANGEDCO progressive slab rates, the Government of Tamil Nadu **100 Free Units Subsidy** (G.O.Ms.No.27), bi-monthly domestic rules, commercial and industrial schedules, fixed charges, and 5% Electricity Duty.
3. **Energy Reading & Telemetry Ingestion:** Supports manual meter readings, CSV/batch uploads, and IoT smart meter ingestion with interval delta calculation and reset detection.
4. **XGBoost Machine-Learning Forecasting:** Chronological time-series regression with lag features (Lag-1, Lag-2, Lag-7) and rolling statistics to predict future kWh consumption.
5. **Coupled Future Cost Forecasting:** Automatically channels ML predicted consumption into the TNERC tariff engine to forecast future electricity costs in **INR (₹)**.
6. **Usage Pattern & Anomaly Detection:** Identifies *Stable*, *Increasing*, *Seasonal*, *Peak-heavy*, and *Irregular* patterns with rolling z-score anomaly alerts.
7. **Interactive Dashboard:** Built with HTML5, CSS3, JavaScript, and Chart.js for real-time visual analytics.
8. **Security & Cloud Deployment:** MongoDB Atlas persistent storage, least-privilege audit logging, rate limiting, and CORS protection.

---

## 📂 Project Structure

```
F:\Projects\Pro-4CC\
├── backend/
│   ├── src/
│   │   ├── config/             # Config & MongoDB Atlas connection
│   │   ├── models/             # Mongoose schemas (User, Location, District, Tariff, Reading, etc.)
│   │   ├── controllers/        # Express request controllers
│   │   ├── routes/             # REST API routes
│   │   ├── middleware/         # Auth, JWT, rate-limiter, error-handler
│   │   ├── services/           # TNERC TariffEngine, PatternDetector, MLForecastBridge, AuditLogger
│   │   ├── seed/               # 38 TN Districts & TNERC master data
│   │   └── server.js           # Express main server
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html              # Landing overview
│   ├── register.html           # TN user registration (38 districts)
│   ├── login.html              # Authentication
│   ├── dashboard.html          # Interactive energy dashboard
│   ├── readings.html           # Meter reading entry & IoT simulator
│   ├── billing.html            # TNERC slab breakdown & calculator
│   ├── predictions.html        # XGBoost ML forecast & pattern analysis
│   ├── devices.html            # Smart meter & IoT device manager
│   ├── admin.html              # Master data, tariffs & audit trail
│   ├── css/style.css           # Modern responsive stylesheet
│   └── js/                     # API client, Auth, Dashboard scripts
├── ml_service/
│   ├── forecast_model.py       # XGBoost regression engine in Python
│   └── requirements.txt        # Python requirements (xgboost, scikit-learn, pandas)
├── docs/
│   ├── ARCHITECTURE.md         # Architecture diagrams & collection design
│   ├── API_DOCUMENTATION.md    # Detailed API endpoint reference
│   └── TNERC_TARIFF_GUIDE.md   # Tamil Nadu electricity tariff explanation
├── tests/
│   ├── tariff.test.js          # Unit tests for TNERC slab calculation & subsidies
│   ├── pattern.test.js         # Unit tests for pattern & anomaly detection
│   └── auth.test.js            # Unit tests for bcrypt & JWT security
├── package.json
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on v22)
- **Python** 3.10+ (with `xgboost`, `pandas`, `scikit-learn`)
- **MongoDB Atlas** database cluster (or local MongoDB)

### 2. Configure Backend Environment
Navigate to `backend/` and verify `.env`:
```bash
cd backend
cp .env.example .env
```
Update `MONGODB_URI` with your MongoDB Atlas connection string:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tn_energy_management?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key_here
PORT=5000
```


## ☁️ Cloud Deployment Guide

### Frontend (Netlify or Vercel)
1. Deploy the `frontend/` directory.
2. In `frontend/js/api.js`, set `API_BASE` to your deployed backend URL.

### Backend (Render, Railway, or AWS)
1. Deploy the `backend/` directory as a Node.js web service.
2. Ensure Python runtime with `xgboost` is installed on the host.
3. Configure environment variables (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`).

### Cloud Database (MongoDB Atlas)
1. Create a free M0 or production cluster on MongoDB Atlas.
2. Create a database user with read/write privileges.
3. Configure Network Access to allow connections from your backend IP allowlist (or `0.0.0.0/0`).

---

## 📄 License
ISC License. Built for Tamil Nadu Cloud Computing in Energy Management.
