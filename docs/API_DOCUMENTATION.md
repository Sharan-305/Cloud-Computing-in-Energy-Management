# REST API Documentation

Base URL: `http://localhost:5000/api`

---

## 1. Authentication & Users

### `POST /api/auth/register`
Creates a genuine user account and linked Tamil Nadu service connection.
- **Rate Limit:** 30 requests per 15 minutes.
- **Request Body:**
```json
{
  "fullName": "Senthil Kumar",
  "email": "senthil@example.com",
  "password": "SecurePassword123",
  "phone": "9840123456",
  "role": "home_user",
  "district": "Chennai",
  "cityOrTown": "Mylapore",
  "pincode": "600004",
  "serviceAddress": "12, South Mada Street",
  "tariffCategory": "domestic",
  "consumerNumber": "01-123-456-789"
}
```
- **Response:** `201 Created` with JWT token and user profile.

### `POST /api/auth/login`
Authenticates user and returns JWT token.
- **Request Body:**
```json
{
  "email": "senthil@example.com",
  "password": "SecurePassword123"
}
```

### `GET /api/auth/me`
Retrieves authenticated user profile and connected service locations. Requires `Authorization: Bearer <token>`.

---

## 2. Location & Tamil Nadu Reference

### `GET /api/locations/districts`
Public master endpoint returning all 38 verified Tamil Nadu districts with headquarters, codes, and postal PIN codes.

### `GET /api/locations`
Returns service locations belonging to the authenticated user.

### `POST /api/locations`
Adds a service location to user account.

---

## 3. Energy Readings & Telemetry

### `POST /api/energy/readings`
Records an interval energy reading in kWh.
- **Request Body:**
```json
{
  "consumptionKwh": 6.8,
  "timestamp": "2026-10-24T08:00:00.000Z",
  "readingSource": "manual",
  "qualityStatus": "valid",
  "notes": "Daily meter reading"
}
```

### `POST /api/energy/readings/batch`
Bulk ingestion of telemetry readings from IoT smart meters, simulation, or CSV batches.

### `GET /api/energy/readings`
Retrieves readings for authenticated user with optional query filters:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `source`: `smart_meter`, `manual`, or `simulation`
- `limit`: Default `100`

---

## 4. TNERC Electricity Bill Estimation

### `POST /api/billing/estimate`
Calculates estimated electricity bill under official TNERC tariff orders.
- **Formula:** `Net Estimated Bill = Energy Charge + Fixed Charge + Electricity Tax (5%) - Subsidies`
- **Request Body:**
```json
{
  "unitsKwh": 250,
  "tariffCategory": "domestic",
  "saveRecord": true
}
```
- **Response:**
```json
{
  "success": true,
  "estimate": {
    "totalUnitsKwh": 250,
    "tariffCategory": "domestic",
    "tariffVersion": "TNERC-TANGEDCO-2024-V1",
    "grossEnergyCharge": 1125.00,
    "subsidyAmount": 450.00,
    "netEnergyCharge": 675.00,
    "fixedCharge": 30.00,
    "taxAmount": 33.75,
    "estimatedAmount": 738.75,
    "breakdown": [...]
  }
}
```

### `GET /api/billing/history`
Returns historical estimated bill records for user.

---

## 5. Machine Learning Prediction & Forecasting

### `POST /api/predictions/generate`
Trains the XGBoost regressor (or baseline for new accounts), forecasts future consumption, identifies usage patterns, and computes future cost in INR through the TNERC tariff engine.

### `GET /api/predictions/latest`
Returns the most recent forecast, trend metrics, and anomaly status.

---

## 6. Devices & IoT

### `GET /api/devices`
Lists user's registered smart meters and sensors.

### `POST /api/devices`
Registers a new smart meter or inverter with unique identifier.

### `POST /api/devices/:id/telemetry`
Simulates live sensor packet transmission.

---

## 7. Administrator Routes (Admin Role Only)

### `GET /api/admin/audit-logs`
Inspects security audit trail (filtered by event type).

### `GET /api/admin/tariffs`
Lists all official TNERC tariff schedules.

### `POST /api/admin/tariffs`
Updates or creates a new tariff rate schedule.

### `GET /api/admin/stats`
Aggregated system metrics across all 38 Tamil Nadu districts.
