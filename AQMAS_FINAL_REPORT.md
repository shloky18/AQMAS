# AQMAS — Final Implementation & Submission Report
**Air Quality Monitoring and Alert System (AQMAS)**  
*College Engineering Project | Module 3 & Module 5 Submission*

---

## 1. Project Overview

AQMAS (Air Quality Monitoring and Alert System) is a full-stack, single-user air quality surveillance system designed for urban monitoring and proactive health safety. The system continuously ingests pollutant telemetry, computes Air Quality Index (AQI) values, and dispatches automated alerts to mitigate acute exposure risks.

### Architecture Stack
- **Frontend:** React 18, Vite 8, Plain CSS (Design system, no Tailwind/Bootstrap)
- **Backend:** Node.js native `http` & `url` modules (**Zero external web framework — No Express**)
- **Database:** MySQL 8.x with `mysql2/promise` connection pooling
- **Architecture Paradigm:** Single-account, local engineering demonstration

---

## 2. Assigned Modules & Features Implemented

### Module 3: Dashboard and Visualization

| SRS Requirement | Implementation Details | Status |
|---|---|---|
| **Current AQI & Pollutant Metrics** | Primary hero card showing live AQI, severity pill, location, and reading timestamp. Dedicated pollutant cards for **PM2.5**, **PM10**, **CO**, **NO2**, **SO2**, and **O3**. | ✅ Complete |
| **Transparent N/A Handling** | When a station does not monitor a specific pollutant (NULL value in database), the UI displays a clean `N/A (Not Monitored)` badge without inventing or faking readings. | ✅ Complete |
| **Historical Visualization & Filters** | Interactive SVG line chart featuring **24 Hours (Day)**, **7 Days (Week)**, and **30 Days (Month)** time filters. Includes hover tooltips with exact timestamps and pollutant values. | ✅ Complete |
| **Statistical Benchmarks** | Real-time computed stats bar displaying period Minimum AQI, Maximum AQI, and Average AQI. | ✅ Complete |
| **Tabular Readings Log** | Chronological data table with matching Day, Week, and Month filters, severity indicators, and full pollutant breakdown. | ✅ Complete |
| **Multi-Location Comparison (Up to 3)** | Select and compare up to 3 cities side-by-side (e.g., Mumbai, Delhi, Pune) with comparative delta metrics. | ✅ Complete |
| **Comparative Multi-Line Chart** | Superimposed historical trajectories comparing the 3 selected cities on a unified timeline with distinct color coding. | ✅ Complete |
| **Regional Station Network Map** | Interactive India regional coordinate station map displaying sensor nodes, live AQI badges, and click-to-focus station capabilities without requiring paid third-party map APIs. | ✅ Complete |

---

### Module 5: Alert and Notification

| SRS Requirement | Implementation Details | Status |
|---|---|---|
| **Single-User Threshold Configuration** | Configure alert threshold value (0–500) and monitoring state (Enabled/Disabled). Persisted in MySQL `aqi_thresholds` table. | ✅ Complete |
| **Automated Threshold Breach Alerts** | Automatically creates an alert when a reading exceeds the configured threshold for that location. | ✅ Complete |
| **Actionable Plain-Language Health Advice** | Generates contextual, medical-grade guidance based on severity breakpoints and rapid surge conditions. | ✅ Complete |
| **SRS 3-Hour Cooldown Duplicate Prevention** | Enforced by MySQL index and backend logic: Suppresses duplicate alerts for continuing breaches within 3 hours (180 minutes). | ✅ Complete |
| **Cooldown Expiration** | A legitimate breach occurring after the 3-hour window successfully generates a new alert. | ✅ Complete |
| **Sudden AQI Spike Detection** | Detects sudden AQI surges **greater than 100 points in less than 3 hours** at the same location, dispatching a high-priority Spike Alert. | ✅ Complete |
| **Spike Duplicate Prevention** | Suppresses repeated spike alerts for the same spike event. Refreshing the dashboard never generates duplicate alerts. | ✅ Complete |
| **Persistent Alert Acknowledgement** | Users can click `✓ Acknowledge` on any active alert. Status changes to `acknowledged` with timestamp recorded in MySQL and remains persisted upon page reload. | ✅ Complete |
| **Disaster-Linked Severe Advisories** | Dedicated emergency feed for disaster-linked pollution crises (e.g., Industrial Chemical Fire, Crop Residue Smog) with priority tags, affected areas, and safety protocols. Clearly labelled as demonstration fixtures. | ✅ Complete |
| **Extensible Notification Channels** | In-app notification center is fully operational as the primary channel. Extensible service stubs in `backend/notifications.js` are prepared for future SMTP/Twilio integration. | ✅ Complete |

---

## 3. Files Created and Modified

### Backend & Database
- `backend/db.js` — Added inline fallback `.env` loader for standalone script/test execution.
- `backend/routes.js` — Implemented all Module 3 and Module 5 endpoints, 3-hour cooldown query, spike detection, multi-city comparison, and error handling.
- `backend/server.js` — Registered new routes (`/api/air-quality/compare`, `/api/disaster-alerts`).
- `backend/notifications.js` *(New)* — Notification dispatcher, health advice engine, and in-app channel delivery.
- `backend/test_modules.js` *(New)* — Comprehensive automated test suite (24 automated tests).
- `backend/package.json` — Added `"test": "node test_modules.js"` script.
- `backend/.env.example` *(New)* — Environment configuration template.
- `database/schema.sql` — Updated unified schema with pollutants, alert metadata, and disaster alerts table.
- `database/seed.sql` — Updated demo seed data with realistic multi-pollutant values and disaster advisories.
- `database/migration_v2.sql` *(New)* — Safe, idempotent SQL migration for existing databases.
- `.gitignore` — Updated to strictly exclude `.env`, `*.env`, `dist/`, and build artifacts.

### Frontend
- `frontend/src/App.jsx` — Central controller wiring dashboard, historical visualization, comparison, alerts, and simulation console.
- `frontend/src/App.css` — CSS design tokens, responsive pollutant cards, chart styles, and alert badges.
- `frontend/src/components/AQISummary.jsx` — 6-pollutant breakdown with transparent N/A handling and severity advice.
- `frontend/src/components/AQIChart.jsx` *(New)* — Responsive SVG historical line chart with Day, Week, and Month filters, tooltips, and stats bar.
- `frontend/src/components/LocationComparison.jsx` *(New)* — Multi-city comparison (up to 3 cities), comparative trajectory chart, and regional station map.
- `frontend/src/components/HistoryTable.jsx` — Tabular historical readings log with matching Day/Week/Month range filters.
- `frontend/src/components/ThresholdConfig.jsx` — Single-account threshold configuration with enable/disable switch and MySQL persistence.
- `frontend/src/components/AlertsSection.jsx` — Alert feed, spike badges, plain-language health guidance, disaster advisories, and persistent acknowledgement.
- `frontend/src/components/TestReading.jsx` — Simulation console with one-click viva demonstration presets.
- `frontend/src/components/Header.jsx` — Header with active alert pill notification, connectivity indicator, and city picker.

---

## 4. Database Architecture & Schema Changes

### Schema Enhancements (Applied via `database/migration_v2.sql`)
1. **`air_quality_readings` Table:**
   - `co DECIMAL(6,2) NULL` — Carbon Monoxide (mg/m³)
   - `no2 DECIMAL(6,2) NULL` — Nitrogen Dioxide (µg/m³)
   - `so2 DECIMAL(6,2) NULL` — Sulfur Dioxide (µg/m³)
   - `o3 DECIMAL(6,2) NULL` — Ground-level Ozone (µg/m³)
2. **`alerts` Table:**
   - `threshold_value INT NULL` — Threshold value configured at time of alert
   - `severity VARCHAR(50) NOT NULL DEFAULT 'Unhealthy'` — Categorical severity
   - `alert_type VARCHAR(50) NOT NULL DEFAULT 'threshold_breach'` — 'threshold_breach', 'spike', or 'disaster'
   - `health_advice TEXT NULL` — Plain-language health guidance
   - `acknowledged_at TIMESTAMP NULL` — Persistent acknowledgement timestamp
   - `INDEX idx_cooldown (location, alert_type, created_at)` — High-performance cooldown query optimization
3. **`disaster_alerts` Table (New):**
   - Stores disaster-linked pollution emergencies with event type, affected area, AQI impact, priority, safety advice, and source disclaimer.

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/locations` | List distinct known locations |
| `GET` | `/api/air-quality?location=Mumbai` | Latest reading for location (includes PM2.5, PM10, CO, NO2, SO2, O3) |
| `GET` | `/api/air-quality/history?location=Mumbai&range=day\|week\|month` | Historical readings filtered by 24h, 7d, or 30d |
| `GET` | `/api/air-quality/compare?locations=Mumbai,Delhi,Pune&range=week` | Multi-city comparison (up to 3 cities) with latest and history |
| `POST` | `/api/air-quality` | Ingest new telemetry; evaluates threshold breaches and sudden spikes |
| `GET` | `/api/thresholds?location=Mumbai` | Fetch threshold configuration for location |
| `POST` | `/api/thresholds` | Save/update threshold configuration in MySQL |
| `GET` | `/api/alerts?location=Mumbai&status=active\|acknowledged` | Fetch alert feed with metadata and health advice |
| `PATCH` | `/api/alerts/:id/acknowledge` | Mark alert as acknowledged and record timestamp in MySQL |
| `GET` | `/api/disaster-alerts?location=Mumbai` | Fetch disaster-linked emergency pollution advisories |

---

## 6. How the Core Logic Works

### Threshold Alerts & 3-Hour Cooldown Logic
1. When a new reading is submitted via `POST /api/air-quality`, the backend checks the threshold configured in `aqi_thresholds`.
2. If `enabled === 1` and `aqi > threshold_value`:
   - The backend queries `alerts` for an existing threshold alert for that location created within the last 3 hours (`created_at >= NOW() - INTERVAL 3 HOUR`).
   - **If found:** The cooldown is active; the duplicate alert is suppressed to prevent alert fatigue.
   - **If not found:** A new alert is inserted with `status = 'active'`, severity, threshold, and plain-language health advice.

### Sudden AQI Spike Detection (>100 Points in <3 Hours)
1. The backend searches `air_quality_readings` for the lowest AQI reading for that location recorded within the preceding 3 hours (`recorded_at >= NOW() - INTERVAL 3 HOUR AND id != current_id`).
2. If `current_aqi - min_previous_aqi > 100`:
   - A rapid spike condition is satisfied.
   - The backend checks if a spike alert was already generated for that location within the last 3 hours to avoid repeats.
   - If not already alerted, an urgent **Spike Alert** (`alert_type = 'spike'`, severity = `'Hazardous'`) is created with specific advice to halt outdoor activities immediately.

---

## 7. Automated Test Results

All 24 automated unit and integration tests executed cleanly:

```
========================================
🧪 AQMAS Automated Test Suite (Mod 3 & 5)
========================================

✅ PASS: Server is healthy (/api/health)
✅ PASS: Locations listed successfully
✅ PASS: Latest reading includes AQI, PM2.5, PM10, and pollutant keys
✅ PASS: History filter: Day filter works
✅ PASS: History filter: Week filter works
✅ PASS: History filter: Month filter works
✅ PASS: Location comparison supports 3 locations with current and historical trends
✅ PASS: Threshold saved in MySQL
✅ PASS: Threshold retrieved correctly from MySQL
✅ PASS: Scenario A: AQI 156 with threshold 100 creates threshold alert
✅ PASS: Duplicate prevention: repeated breach within 3 hours is suppressed by cooldown
✅ PASS: Cooldown expiration: legitimate breach after 3 hours creates a new alert
✅ PASS: Scenario B: AQI 65 with threshold 100 does NOT create an alert
✅ PASS: Scenario C: Disabled threshold prevents alert generation on AQI 156
✅ PASS: Spike detection: AQI jump > 100 points within < 3 hours triggers a high-priority spike alert
✅ PASS: Spike persistence: Page refresh / alert fetch reads existing records without creating duplicates
✅ PASS: Spike cooldown: repeated reading during spike cooldown does not generate repeated spike alerts
✅ PASS: Alert acknowledgement marks alert as acknowledged
✅ PASS: Alert acknowledgement persists in MySQL upon refetching
✅ PASS: Disaster-linked alerts returned with safety advice and fixture notice
✅ PASS: Invalid negative AQI safely rejected with 400
✅ PASS: Missing location safely rejected with 400
✅ PASS: Regression check: Existing Delhi endpoint works properly
✅ PASS: Regression check: Existing default 20-limit history endpoint works properly

========================================
🏁 TEST RESULTS: 24 PASSED, 0 FAILED
========================================
```

---

## 8. Windows Instructions to Run the Application

### 1. Database Setup
Ensure MySQL is running on port 3306. Apply the migration:
```cmd
cd C:\Users\DELL\Desktop\AQMAS
mysql -u root -p < database/migration_v2.sql
```
*(Or for a fresh database: `mysql -u root -p < database/schema.sql` followed by `mysql -u root -p < database/seed.sql`)*

### 2. Environment Configuration
Verify that `backend/.env` exists with your local MySQL password:
```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=aqmas_db
PORT=5000
```

### 3. Start Backend
In a PowerShell or CMD terminal:
```powershell
cd C:\Users\DELL\Desktop\AQMAS\backend
npm start
```
*(Runs at `http://localhost:5000`)*

### 4. Start Frontend
In a second PowerShell or CMD terminal:
```powershell
cd C:\Users\DELL\Desktop\AQMAS\frontend
npm run dev
```
*(Opens at `http://localhost:5173`)*

---

## 9. Recommended Screenshots to Capture for Viva

1. **Dashboard & Pollutants View:** Showing current AQI (Mumbai: 162 - Unhealthy), timestamp, and the 6 pollutant cards (including values for PM2.5/PM10/CO/NO2/SO2/O3 and clear `N/A` handling).
2. **Historical Trend Filters:** Showing the interactive SVG chart with the **24 Hours**, **7 Days**, and **30 Days** buttons toggled and the Min/Max/Avg stats bar.
3. **Multi-City Comparison & Regional Map:** Showing 3 cities compared side-by-side with the comparative multi-line chart and the regional station map pins.
4. **Alerts Feed & Health Advice:** Showing active alert cards with plain-language health guidance, the emergency disaster advisories box, and the `✓ Acknowledge` button.
5. **Demonstration Telemetry Console:** Showing the quick preset buttons (`Scenario A: Breach (156)`, `Scenario B: Safe (65)`, `Scenario C: Spike (220)`) and the result banner indicating alert generation or 3-hour cooldown duplicate suppression.

---

## 10. Remaining Limitations & Future Work

- **Live Government API Feeds:** External disaster and weather feeds are currently implemented using demonstration fixtures to ensure full local autonomy without paid API keys. Integrating live CPCB or OpenWeather APIs requires registering production API keys and whitelisting IP endpoints.
- **Cellular SMS / SMTP Gateway:** In-app alerts are fully operational. Direct SMS delivery requires a registered Twilio or Fast2SMS gateway and DLT template registration. Stubs in `backend/notifications.js` are ready for immediate integration.
- **Multi-Tenant Administration:** User roles and multi-user authentication are intentionally omitted per the single-account college project specification.

---

## 11. Short Viva Explanation for Your Professor

> *"Good morning, Professor. For our Air Quality Monitoring and Alert System (AQMAS), I was assigned Module 3 (Dashboard and Visualization) and Module 5 (Alert and Notification).*
>
> *In **Module 3**, the system monitors 6 major pollutants: PM2.5, PM10, CO, NO2, SO2, and O3. A key design principle is transparency: if a station does not monitor a pollutant, our interface displays a clear 'N/A' indicator rather than fabricating numbers. For analytics, we built an interactive SVG chart supporting Day (24-hour), Week (7-day), and Month (30-day) queries directly from MySQL, alongside a multi-location comparison tool that compares up to 3 cities simultaneously with superimposed trajectories and a regional station map.*
>
> *In **Module 5**, we implemented an automated alert engine that enforces threshold monitoring and sudden spike detection. If a reading exceeds the configured threshold, the system generates an active warning accompanied by actionable, plain-language health advice. To prevent alert fatigue, our backend enforces an SRS-compliant 3-hour cooldown window that suppresses duplicate alerts for continuing breaches. Furthermore, if air quality rapidly degrades by more than 100 AQI points in under 3 hours, a high-priority spike alert is triggered. All alert acknowledgements are persistently saved in MySQL."*
