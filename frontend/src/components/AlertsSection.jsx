// AlertsSection — displays alert history and allows acknowledging active alerts

import { useState } from 'react'

function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString()
}

export default function AlertsSection({ alerts, loading, location, apiBase, onAcknowledged }) {
    const [ackLoading, setAckLoading] = useState({})   // { [alertId]: true|false }
    const [error, setError] = useState(null)

    const activeAlerts = alerts.filter((a) => a.status === 'active')
    const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged')

    async function handleAcknowledge(alertId) {
        setAckLoading((prev) => ({ ...prev, [alertId]: true }))
        setError(null)
        try {
            const res = await fetch(`${apiBase}/api/alerts/${alertId}/acknowledge`, {
                method: 'PATCH',
            })
            const data = await res.json()
            if (res.ok) {
                onAcknowledged(data.alert)
            } else {
                setError(data.error || 'Failed to acknowledge alert.')
            }
        } catch {
            setError('Network error. Is the backend running?')
        } finally {
            setAckLoading((prev) => ({ ...prev, [alertId]: false }))
        }
    }

    return (
        <section className="section">
            <h2 className="section-title">
                <span className="icon">🚨</span>
                Alert History — {location}
                {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
            </h2>

            {/* Warning banner for active alerts */}
            {activeAlerts.length > 0 && (
                <div className="alert-banner warning" id="active-alerts-banner">
                    ⚠️ <strong>{activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''}</strong> for {location}. Please review below.
                </div>
            )}

            {error && (
                <div className="alert-banner error">{error}</div>
            )}

            {!loading && alerts.length === 0 && (
                <div className="state-box">
                    <span style={{ fontSize: '1.8rem' }}>✅</span>
                    <span>No alerts found for <strong>{location}</strong>.</span>
                    <span className="text-muted">Alerts are generated when AQI exceeds the configured threshold.</span>
                </div>
            )}

            {alerts.length > 0 && (
                <div className="alert-list">
                    {/* Active alerts first */}
                    {activeAlerts.map((alert) => (
                        <div key={alert.id} className="alert-card active">
                            <div className="alert-card-body">
                                <div className="alert-message">{alert.message}</div>
                                <div className="alert-meta">
                                    <span>📍 {alert.location}</span>
                                    <span>💨 AQI: <strong>{alert.aqi}</strong></span>
                                    <span>🕐 {formatDate(alert.created_at)}</span>
                                    <span className="status-pill active">Active</span>
                                </div>
                            </div>
                            <button
                                id={`btn-ack-${alert.id}`}
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleAcknowledge(alert.id)}
                                disabled={ackLoading[alert.id]}
                                style={{ flexShrink: 0 }}
                            >
                                {ackLoading[alert.id] ? 'Saving…' : '✓ Acknowledge'}
                            </button>
                        </div>
                    ))}

                    {/* Acknowledged alerts */}
                    {acknowledgedAlerts.map((alert) => (
                        <div key={alert.id} className="alert-card acknowledged">
                            <div className="alert-card-body">
                                <div className="alert-message" style={{ color: 'var(--color-text-muted)' }}>
                                    {alert.message}
                                </div>
                                <div className="alert-meta">
                                    <span>📍 {alert.location}</span>
                                    <span>💨 AQI: {alert.aqi}</span>
                                    <span>🕐 {formatDate(alert.created_at)}</span>
                                    <span className="status-pill acknowledged">Acknowledged</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
