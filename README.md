# AQMAS — Air Quality Alert Generation System

A full-stack college engineering project that monitors Air Quality Index (AQI) data for selected locations and generates automated alerts when readings exceed user-defined thresholds.

**Stack:** React + Vite (frontend) | Node.js built-in `http` module — no Express (backend) | MySQL (database)

---

## Project Structure

```
AQMAS/
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── AQISummary.jsx
│   │   │   ├── HistoryTable.jsx
│   │   │   ├── ThresholdConfig.jsx
│   │   │   ├── AlertsSection.jsx
│   │   │   └── TestReading.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend/                # Node.js REST API (no Express)
│   ├── server.js           # HTTP server + routing
│   ├── routes.js           # All route handlers
│   ├── db.js               # MySQL connection pool
│   ├── .env.example        # Template for environment variables
│   └── package.json
├── database/
│   ├── schema.sql          # Database and table definitions
│   └── seed.sql            # Sample data for demo
└── README.md
```

---

## Prerequisites

- **Node.js** v18 or later — https://nodejs.org
- **MySQL** 8.x — https://dev.mysql.com/downloads/mysql/
- A MySQL client (MySQL Workbench, DBeaver, or the `mysql` CLI)

---

## Step 1 — Set Up MySQL Database

Open your MySQL client and run the following two files in order:

```sql
-- 1. Create the database and tables
source C:/Users/User/Desktop/AQMAS/database/schema.sql

-- 2. Insert sample data
source C:/Users/User/Desktop/AQMAS/database/seed.sql
```

Or from the command line:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

---

## Step 2 — Configure Backend Environment Variables

```bash
cd backend
copy .env.example .env     # Windows
# or:  cp .env.example .env  (Mac/Linux)
```

Open `backend/.env` and fill in your MySQL credentials:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=aqmas_db
PORT=5000
```

---

## Step 3 — Install Dependencies

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

---

## Step 4 — Start the Backend

```bash
cd backend
npm start
```

Expected output:
```
[Server] Loaded environment from .env
[DB] MySQL connection pool established successfully.
[Server] ✅ AQMAS backend running at http://localhost:5000
[Server] Health check: http://localhost:5000/api/health
```

Test it:
```bash
curl http://localhost:5000/api/health
# → {"status":"ok","timestamp":"..."}

curl "http://localhost:5000/api/air-quality?location=Mumbai"
# → latest reading JSON for Mumbai
```

---

## Step 5 — Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm run dev
```

Open your browser at: **http://localhost:5173**

---

## API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/locations` | List all known locations |
| GET | `/api/air-quality?location=Mumbai` | Latest reading for a location |
| GET | `/api/air-quality/history?location=Mumbai` | Last 20 readings (newest first) |
| POST | `/api/air-quality` | Submit new reading (checks threshold, generates alert) |
| GET | `/api/thresholds?location=Mumbai` | Get threshold config for location |
| POST | `/api/thresholds` | Save/update threshold config |
| GET | `/api/alerts?location=Mumbai` | Get alert history for location |
| PATCH | `/api/alerts/:id/acknowledge` | Mark alert as acknowledged |

### POST /api/air-quality — Request Body

```json
{
  "location": "Mumbai",
  "aqi": 156,
  "pm25": 68.5,
  "pm10": 120.3
}
```

### POST /api/thresholds — Request Body

```json
{
  "location": "Mumbai",
  "threshold_value": 100,
  "enabled": true
}
```

---

## Demonstration Scenarios

### Scenario A — Alert Generated
1. Select **Mumbai** in the header dropdown
2. Go to **AQI Threshold Configuration** → set threshold to `100`, ensure monitoring is **enabled** → click Save
3. Go to **Submit Test Reading** → enter AQI `156`, PM2.5 `68.5`, PM10 `120.3` → click Submit
4. Result banner shows "Alert generated"
5. Dashboard updates with new reading
6. Alert appears in **Alert History** with status **Active**

### Scenario B — No Alert Generated
1. Keep threshold at `100` for Mumbai
2. Submit a reading with AQI `65`
3. Result banner shows "No alert generated"
4. Reading is saved but no new alert appears

### Scenario C — Threshold Disabled
1. In Threshold Configuration, toggle monitoring **OFF** → Save
2. Submit a reading with AQI `156`
3. Reading is saved but no alert is generated

### Scenario D — Acknowledge Alert
1. Generate an alert (Scenario A)
2. Click **✓ Acknowledge** on the active alert card
3. Status changes from **Active** to **Acknowledged** immediately
4. Refresh the page — status persists (stored in MySQL)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ER_ACCESS_DENIED_ERROR` | Check DB_USER and DB_PASSWORD in `.env` |
| `ECONNREFUSED` on DB | MySQL server is not running — start it |
| `EADDRINUSE 5000` | Another app uses port 5000 — change `PORT=5001` in `.env` |
| `EADDRINUSE 5173` | Change Vite port in `vite.config.js` (`server.port`) |
| Backend Offline indicator | Backend is not running — run `npm start` in `backend/` |
| No readings shown | Import `seed.sql` in MySQL first |
| CORS errors | Ensure backend is running on port 5000 and Vite proxy is active |

---

## Technologies Used

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18, Vite | Plain JavaScript, no TypeScript |
| Styling | Plain CSS | No Tailwind, no Bootstrap |
| Backend | Node.js built-in `http` | **No Express** — custom routing |
| Database driver | `mysql2` | Only external npm package |
| Database | MySQL 8.x | Transactions, foreign keys |

---

*AQMAS — College Engineering Project | For demonstration purposes. Sample data is not live measurements.*
