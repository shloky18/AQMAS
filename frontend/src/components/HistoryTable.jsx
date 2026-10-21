// HistoryTable — shows recent AQI readings with Day/Week/Month range filtering (Module 3)

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

function formatPollutant(val) {
    if (val === null || val === undefined || val === '') return '—'
    return parseFloat(val).toFixed(1)
}

export default function HistoryTable({ history = [], loading, location, range, onRangeChange }) {
    return (
        <section className="section" id="history-table-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">📋</span>
                        Historical Readings Log — {location}
                        {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Chronological record of verified station pollutants
                    </span>
                </div>

                <div className="filter-button-group">
                    <button
                        className={`btn-filter ${range === 'day' ? 'active' : ''}`}
                        onClick={() => onRangeChange('day')}
                    >
                        24 Hours
                    </button>
                    <button
                        className={`btn-filter ${range === 'week' ? 'active' : ''}`}
                        onClick={() => onRangeChange('week')}
                    >
                        7 Days
                    </button>
                    <button
                        className={`btn-filter ${range === 'month' ? 'active' : ''}`}
                        onClick={() => onRangeChange('month')}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {!loading && history.length === 0 && (
                <div className="state-box">
                    <span style={{ fontSize: '1.8rem' }}>📭</span>
                    <span>No historical readings available for <strong>{location}</strong> in this timeframe ({range}).</span>
                </div>
            )}

            {history.length > 0 && (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>AQI</th>
                                <th>PM2.5 (µg/m³)</th>
                                <th>PM10 (µg/m³)</th>
                                <th>CO (mg/m³)</th>
                                <th>NO2 (µg/m³)</th>
                                <th>SO2 (µg/m³)</th>
                                <th>O3 (µg/m³)</th>
                                <th>Severity</th>
                                <th>Recorded At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((row, idx) => (
                                <tr key={row.id}>
                                    <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{idx + 1}</td>
                                    <td>
                                        <strong style={{
                                            color: row.aqi > 200 ? 'var(--color-very-unhealth)' :
                                                row.aqi > 150 ? 'var(--color-unhealthy)' :
                                                    row.aqi > 100 ? 'var(--color-sensitive)' :
                                                        row.aqi > 50 ? 'var(--color-moderate)' : 'var(--color-good)',
                                        }}>
                                            {row.aqi}
                                        </strong>
                                    </td>
                                    <td>{formatPollutant(row.pm25)}</td>
                                    <td>{formatPollutant(row.pm10)}</td>
                                    <td>{formatPollutant(row.co)}</td>
                                    <td>{formatPollutant(row.no2)}</td>
                                    <td>{formatPollutant(row.so2)}</td>
                                    <td>{formatPollutant(row.o3)}</td>
                                    <td>
                                        <span className={`severity-badge ${severityClass(row.severity)}`}>
                                            {row.severity}
                                        </span>
                                    </td>
                                    <td className="timestamp">{formatDate(row.recorded_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
