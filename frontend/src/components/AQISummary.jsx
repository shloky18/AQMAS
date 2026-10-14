// AQISummary component — displays four summary cards for the selected location

// Returns the CSS class suffix for a severity string
function severityClass(severity) {
    if (!severity) return ''
    const s = severity.toLowerCase()
    if (s === 'good') return 'sev-good'
    if (s === 'moderate') return 'sev-moderate'
    if (s.includes('sensitive')) return 'sev-sensitive'
    if (s === 'unhealthy') return 'sev-unhealthy'
    if (s.includes('very')) return 'sev-very-unhealthy'
    if (s === 'hazardous') return 'sev-hazardous'
    return 'sev-moderate'
}

function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString()
}

export default function AQISummary({ reading, loading, location }) {
    if (loading && !reading) {
        return (
            <section className="section">
                <h2 className="section-title"><span className="icon">📊</span>AQI Dashboard — {location}</h2>
                <div className="state-box"><div className="spinner" /><span>Loading readings…</span></div>
            </section>
        )
    }

    if (!reading) {
        return (
            <section className="section">
                <h2 className="section-title"><span className="icon">📊</span>AQI Dashboard — {location}</h2>
                <div className="state-box">
                    <span style={{ fontSize: '2rem' }}>🌫️</span>
                    <span>No readings found for <strong>{location}</strong>.</span>
                    <span className="text-muted">Submit a test reading below to get started.</span>
                </div>
            </section>
        )
    }

    const aqiColor =
        reading.aqi <= 50 ? 'linear-gradient(135deg,#166534,#16a34a)' :
            reading.aqi <= 100 ? 'linear-gradient(135deg,#92400e,#d97706)' :
                reading.aqi <= 150 ? 'linear-gradient(135deg,#9a3412,#ea580c)' :
                    reading.aqi <= 200 ? 'linear-gradient(135deg,#991b1b,#dc2626)' :
                        reading.aqi <= 300 ? 'linear-gradient(135deg,#6b21a8,#9333ea)' :
                            'linear-gradient(135deg,#3b0764,#6b21a8)'

    return (
        <section className="section">
            <h2 className="section-title">
                <span className="icon">📊</span>
                AQI Dashboard — {location}
                {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
            </h2>

            <div className="summary-grid">
                {/* Card 1 — Current AQI (most prominent) */}
                <div className="summary-card aqi-card" style={{ background: aqiColor }}>
                    <div className="card-label">Current AQI</div>
                    <div className="card-value">{reading.aqi}</div>
                    <div className="card-sub">
                        <span className="severity-badge" style={{ background: 'rgba(255,255,255,0.20)', color: 'white' }}>
                            {reading.severity}
                        </span>
                    </div>
                    <div className="card-sub" style={{ marginTop: 12, fontSize: '0.78rem', opacity: 0.75 }}>
                        🕐 {formatDate(reading.recorded_at)}
                    </div>
                </div>

                {/* Card 2 — PM2.5 */}
                <div className="summary-card">
                    <div className="card-label">PM2.5</div>
                    <div className="card-value" style={{ color: reading.pm25 > 35 ? 'var(--color-unhealthy)' : 'var(--color-text)' }}>
                        {parseFloat(reading.pm25).toFixed(1)}
                    </div>
                    <div className="card-sub">µg/m³</div>
                </div>

                {/* Card 3 — PM10 */}
                <div className="summary-card">
                    <div className="card-label">PM10</div>
                    <div className="card-value" style={{ color: reading.pm10 > 70 ? 'var(--color-unhealthy)' : 'var(--color-text)' }}>
                        {parseFloat(reading.pm10).toFixed(1)}
                    </div>
                    <div className="card-sub">µg/m³</div>
                </div>

                {/* Card 4 — Severity */}
                <div className="summary-card">
                    <div className="card-label">Severity</div>
                    <div style={{ marginTop: 8 }}>
                        <span className={`severity-badge ${severityClass(reading.severity)}`} style={{ fontSize: '0.88rem', padding: '6px 14px' }}>
                            {reading.severity}
                        </span>
                    </div>
                    <div className="card-sub" style={{ marginTop: 12 }}>
                        {reading.aqi <= 50 && '✅ Air quality is satisfactory.'}
                        {reading.aqi > 50 && reading.aqi <= 100 && '⚠️ Acceptable; some risk for sensitive people.'}
                        {reading.aqi > 100 && reading.aqi <= 150 && '🔶 Sensitive groups should limit outdoor exposure.'}
                        {reading.aqi > 150 && reading.aqi <= 200 && '🔴 Everyone may experience health effects.'}
                        {reading.aqi > 200 && '🟣 Health warning — minimize outdoor activity.'}
                    </div>
                </div>
            </div>
        </section>
    )
}
