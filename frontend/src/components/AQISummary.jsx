// AQISummary component — displays current AQI, severity, timestamp, and pollutant breakdown
// SRS Module 3: Show only available pollutant values; clearly handle unavailable ones without inventing values.

import React from 'react'

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
            <section className="section" id="aqi-summary-section">
                <h2 className="section-title"><span className="icon">📊</span>Current Air Quality — {location}</h2>
                <div className="state-box"><div className="spinner" /><span>Loading readings…</span></div>
            </section>
        )
    }

    if (!reading) {
        return (
            <section className="section" id="aqi-summary-section">
                <h2 className="section-title"><span className="icon">📊</span>Current Air Quality — {location}</h2>
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

    const pollutants = [
        { label: 'PM2.5', value: reading.pm25, unit: 'µg/m³', benchmark: 35, desc: 'Fine particulate matter' },
        { label: 'PM10', value: reading.pm10, unit: 'µg/m³', benchmark: 70, desc: 'Respirable particulate' },
        { label: 'CO', value: reading.co, unit: 'mg/m³', benchmark: 4.0, desc: 'Carbon Monoxide' },
        { label: 'NO2', value: reading.no2, unit: 'µg/m³', benchmark: 40, desc: 'Nitrogen Dioxide' },
        { label: 'SO2', value: reading.so2, unit: 'µg/m³', benchmark: 20, desc: 'Sulfur Dioxide' },
        { label: 'O3', value: reading.o3, unit: 'µg/m³', benchmark: 100, desc: 'Ground-level Ozone' },
    ]

    return (
        <section className="section" id="aqi-summary-section">
            <div className="section-header">
                <h2 className="section-title">
                    <span className="icon">📊</span>
                    Current Air Quality — {location}
                    {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
                </h2>
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                    Station reading as of: <strong>{formatDate(reading.recorded_at)}</strong>
                </span>
            </div>

            {/* Hero Summary Grid */}
            <div className="summary-grid">
                {/* Primary Card: Current AQI */}
                <div className="summary-card aqi-card" style={{ background: aqiColor }}>
                    <div className="card-label">Current AQI Index</div>
                    <div className="card-value">{reading.aqi}</div>
                    <div className="card-sub">
                        <span className="severity-badge" style={{ background: 'rgba(255,255,255,0.22)', color: 'white' }}>
                            {reading.severity}
                        </span>
                    </div>
                    <div className="card-sub" style={{ marginTop: 12, fontSize: '0.78rem', opacity: 0.85 }}>
                        📍 {location} • 🕐 {formatDate(reading.recorded_at)}
                    </div>
                </div>

                {/* Health Advisory & Severity Card */}
                <div className="summary-card" style={{ gridColumn: 'span 3' }}>
                    <div className="card-label">Air Quality Severity & Advisory</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                        <span className={`severity-badge ${severityClass(reading.severity)}`} style={{ fontSize: '0.95rem', padding: '6px 14px' }}>
                            {reading.severity}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                            {reading.aqi <= 50 ? 'Level 1: Minimal Impact' :
                                reading.aqi <= 100 ? 'Level 2: Minor Breathing Discomfort' :
                                    reading.aqi <= 150 ? 'Level 3: Sensitive Groups Caution' :
                                        reading.aqi <= 200 ? 'Level 4: Broad Population Health Effect' :
                                            reading.aqi <= 300 ? 'Level 5: Health Alert' : 'Level 6: Emergency Hazardous'}
                        </span>
                    </div>

                    <div className="card-sub" style={{ marginTop: 14, fontSize: '0.88rem', lineHeight: '1.5' }}>
                        {reading.aqi <= 50 && '✅ Air quality is satisfactory. Air pollution poses little or no risk for outdoor sports or activities.'}
                        {reading.aqi > 50 && reading.aqi <= 100 && '⚠️ Acceptable quality. Very sensitive individuals may experience slight respiratory irritation.'}
                        {reading.aqi > 100 && reading.aqi <= 150 && '🔶 Children, seniors, and individuals with respiratory/cardiac conditions should limit prolonged outdoor exertion.'}
                        {reading.aqi > 150 && reading.aqi <= 200 && '🔴 Everyone may begin to experience health effects; wear an N95 mask outdoors and keep windows closed.'}
                        {reading.aqi > 200 && reading.aqi <= 300 && '🟣 Serious respiratory risk. Minimize outdoor activity, avoid strenuous exercise, and operate indoor HEPA purifiers.'}
                        {reading.aqi > 300 && '🟤 Hazardous emergency conditions. Stay indoors with doors and windows sealed.'}
                    </div>
                </div>
            </div>

            {/* Pollutants Breakdown Grid (SRS Module 3 Requirement) */}
            <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: 12 }}>
                    Monitored Atmospheric Pollutants
                </h3>
                <div className="pollutant-grid">
                    {pollutants.map((p) => {
                        const hasValue = p.value !== null && p.value !== undefined && p.value !== ''
                        const valNum = hasValue ? parseFloat(p.value) : null
                        const isHigh = hasValue && valNum > p.benchmark

                        return (
                            <div key={p.label} className={`pollutant-card ${!hasValue ? 'unavailable' : ''}`}>
                                <div className="pollutant-header">
                                    <span className="pollutant-name">{p.label}</span>
                                    <span className="pollutant-desc">{p.desc}</span>
                                </div>

                                <div className="pollutant-body">
                                    {hasValue ? (
                                        <>
                                            <span className="pollutant-value" style={{ color: isHigh ? 'var(--color-unhealthy)' : 'var(--color-text)' }}>
                                                {valNum.toFixed(1)}
                                            </span>
                                            <span className="pollutant-unit">{p.unit}</span>
                                            {isHigh && <span className="pollutant-status high">Above Guide</span>}
                                        </>
                                    ) : (
                                        <div className="pollutant-na-wrap">
                                            <span className="pollutant-na-badge">N/A</span>
                                            <span className="pollutant-na-text">Not monitored</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="pollutant-legend text-muted" style={{ marginTop: 8, fontSize: '0.75rem' }}>
                    * Values marked <strong>N/A</strong> represent pollutants not measured at this station. Only verified readings are displayed.
                </div>
            </div>
        </section>
    )
}
