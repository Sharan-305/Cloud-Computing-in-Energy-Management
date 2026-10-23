# System Architecture

## Cloud Computing in Energy Management (Tamil Nadu)

This platform provides an end-to-end cloud computing system for monitoring electricity consumption, estimating electricity bills under official TNERC tariff orders, identifying consumption dynamics, and predicting future energy demand using XGBoost supervised regression.

```
Registered Users across Tamil Nadu (Chennai, Coimbatore, Madurai, etc.)
                      │
                      ▼
┌────────────────────────────────────────────────────────┐
│           Frontend Layer (HTML5 / CSS3 / JavaScript)   │
│  - Dashboard, Readings, Bill Calculator, Forecast, Admin│
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS REST API
                           ▼
┌────────────────────────────────────────────────────────┐
│             Backend API Layer (Node.js & Express)      │
│  - JWT Authentication & Role Authorization             │
│  - Tamil Nadu 38 Districts Registry                    │
│  - Energy Reading & Telemetry Ingestion                │
│  - Official TNERC Tariff Calculation Engine            │
│  - Statistical Pattern & Anomaly Detector              │
│  - XGBoost ML Bridge Service                           │
│  - System Audit Logging                                │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌───────────────────────────┐
│  Python Machine Learning  │ │       MongoDB Atlas       │
│  - Feature Engineering    │ │  - users                  │
│    (Lags 1, 2, 7 & Rolls) │ │  - service_locations     │
│  - XGBoost Regressor      │ │  - districts (38 TN)      │
│  - Chronological Holdout  │ │  - tariff_rates (TNERC)   │
│  - Horizon Projections    │ │  - energy_readings        │
│                           │ │  - billing_records        │
│                           │ │  - usage_predictions     │
│                           │ │  - devices & audit_logs   │
└───────────────────────────┘ └───────────────────────────┘
```

---

## Database Collections & Schema Design

### 1. `users`
- Stores authentic user accounts created through registration.
- Passwords securely hashed with bcrypt (salt rounds = 12).
- Normalized unique email address.
- Role: `home_user`, `industry_user`, or `admin`. Users cannot self-assign `admin`.

### 2. `service_locations`
- Binds a user to their physical electricity service connection in Tamil Nadu.
- Fields: `district`, `cityOrTown`, `pincode`, `serviceAddress`, `discom` ("TANGEDCO"), `tariffCategory` ("domestic", "commercial", "industrial"), `consumerNumberEncrypted`.

### 3. `districts`
- Master reference dataset containing all 38 districts of Tamil Nadu with standard postal PIN code ranges and district codes.

### 4. `tariff_rates`
- Effective-dated official Tamil Nadu Electricity Regulatory Commission (TNERC) tariff rules.
- Contains progressive slabs, subsidies (100 free units scheme), fixed charges, electricity tax (5%), and version identifier (`TNERC-TANGEDCO-2024-V1`).

### 5. `energy_readings`
- Measured or clearly labeled simulated readings in kilowatt-hours (kWh).
- Supports cumulative meter delta calculation, rollover handling, and IoT telemetry ingestion.

### 6. `billing_records`
- Estimated electricity bills calculated with effective-dated tariff versions.
- Preserves full slab-by-slab breakdown, gross charges, government subsidies, and net payable amounts.

### 7. `usage_predictions`
- XGBoost machine-learning projections and pattern classifications (`stable`, `increasing`, `seasonal`, `peak_heavy`, `irregular`).
- Contains daily forecasts, confidence intervals, and anomaly scores.

### 8. `devices`
- IoT smart meter, rooftop solar inverter, and gateway registry.

### 9. `audit_logs`
- Security and compliance events. Strictly omits passwords, hashes, and authorization tokens.

---

## Machine Learning Pipeline (XGBoost)

1. **Chronological Ingestion:** Energy readings are sorted chronologically by timestamp.
2. **Feature Engineering:**
   - Time features: `day_of_week`, `is_weekend`, `month`.
   - Lag features: `lag_1`, `lag_2`, `lag_7`.
   - Moving statistics: 3-day rolling mean, 7-day rolling mean, 7-day rolling standard deviation.
3. **Training & Validation:** Evaluated on chronological holdout data using Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE).
4. **Tariff Cost Coupling:** Forecasted kWh units are piped directly into the Tamil Nadu Tariff Engine to calculate future costs in Indian Rupees (INR).
