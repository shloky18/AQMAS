// HistoryTable — shows recent AQI readings for the selected location

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

export default function HistoryTable({ history, loading, location }) {
    return (
        <section className="section">
            <h2 className="section-title">
                <span className="icon">📋</span>
                Recent Readings — {location}
                {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
            </h2>

            {!loading && history.length === 0 && (
                <div className="state-box">
                    <span style={{ fontSize: '1.8rem' }}>📭</span>
                    <span>No historical readings available for <strong>{location}</strong>.</span>
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
                                            color: row.aqi > 150 ? 'var(--color-unhealthy)' :
                                                row.aqi > 100 ? 'var(--color-sensitive)' :
                                                    row.aqi > 50 ? 'var(--color-moderate)' : 'var(--color-good)',
                                        }}>
                                            {row.aqi}
                                        </strong>
                                    </td>
                                    <td>{parseFloat(row.pm25).toFixed(1)}</td>
                                    <td>{parseFloat(row.pm10).toFixed(1)}</td>
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
