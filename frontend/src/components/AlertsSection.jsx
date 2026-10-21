// AlertsSection.jsx — Alert management, acknowledgement, and disaster advisories (Module 5)
// Displays active & historical alerts, sudden spikes, plain-language health advice, and disaster events.

import React, { useState, useEffect } from 'react'

function formatDate(ts) {
    if (!ts) return '—'
    return new Date(ts).toLocaleString()
}

function getAlertBadge(alertType) {
    if (alertType === 'spike') {
        return <span className="alert-type-badge spike">⚡ Sudden AQI Spike</span>
    }
    if (alertType === 'disaster') {
        return <span className="alert-type-badge disaster">🚨 Disaster Hazard</span>
    }
    return <span className="alert-type-badge breach">⚠️ Threshold Breach</span>
}

export default function AlertsSection({ alerts = [], loading, location, apiBase, onAcknowledged }) {
    const [ackLoading, setAckLoading] = useState({})
    const [error, setError] = useState(null)
    const [filterTab, setFilterTab] = useState('all') // 'all' | 'active' | 'acknowledged'
    const [disasterAlerts, setDisasterAlerts] = useState([])
    const [loadingDisasters, setLoadingDisasters] = useState(false)

    // Fetch disaster alerts on mount & location change
    useEffect(() => {
        fetchDisasterAlerts()
    }, [location])

    async function fetchDisasterAlerts() {
        setLoadingDisasters(true)
        try {
            const res = await fetch(`${apiBase}/api/disaster-alerts?location=${encodeURIComponent(location)}`)
            if (res.ok) {
                const data = await res.json()
                setDisasterAlerts(data.disasterAlerts || [])
            }
        } catch {
            // silent fail
        } finally {
            setLoadingDisasters(false)
        }
    }

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
            setError('Network error while acknowledging alert.')
        } finally {
            setAckLoading((prev) => ({ ...prev, [alertId]: false }))
        }
    }

    const activeAlerts = alerts.filter((a) => a.status === 'active')
    const acknowledgedAlerts = alerts.filter((a) => a.status === 'acknowledged')

    const displayedAlerts = filterTab === 'active'
        ? activeAlerts
        : filterTab === 'acknowledged'
            ? acknowledgedAlerts
            : alerts

    return (
        <section className="section" id="alerts-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">🚨</span>
                        Alert Feed & Notification Dispatcher — {location}
                        {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Automated threshold breach & spike detection with SRS 3-hour cooldown duplicate prevention
                    </span>
                </div>

                {/* Filter Tabs */}
                <div className="filter-button-group">
                    <button
                        className={`btn-filter ${filterTab === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterTab('all')}
                    >
                        All ({alerts.length})
                    </button>
                    <button
                        className={`btn-filter ${filterTab === 'active' ? 'active' : ''}`}
                        onClick={() => setFilterTab('active')}
                    >
                        Active ({activeAlerts.length})
                    </button>
                    <button
                        className={`btn-filter ${filterTab === 'acknowledged' ? 'active' : ''}`}
                        onClick={() => setFilterTab('acknowledged')}
                    >
                        Acknowledged ({acknowledgedAlerts.length})
                    </button>
                </div>
            </div>

            {/* Active alerts prominent banner */}
            {activeAlerts.length > 0 && (
                <div className="alert-banner warning" id="active-alerts-banner">
                    <div>
                        <strong>⚠️ {activeAlerts.length} Active Pollution Warning{activeAlerts.length > 1 ? 's' : ''}</strong> requiring attention for {location}.
                        <div style={{ fontSize: '0.78rem', marginTop: 4, opacity: 0.9 }}>
                            * Duplicate alerts for continuing breaches are automatically suppressed during the 3-hour cooldown window.
                        </div>
                    </div>
                </div>
            )}

            {error && <div className="alert-banner error">{error}</div>}

            {/* Disaster / Emergency Alerts Card (Module 5 Requirement) */}
            {disasterAlerts.length > 0 && (
                <div className="disaster-section-box">
                    <div className="disaster-header">
                        <span style={{ fontSize: '1.2rem' }}>🔥</span>
                        <div>
                            <strong>Disaster-Linked Severe Pollution Advisories</strong>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                Demonstration fixtures for extreme atmospheric crisis integration (No paid weather API required)
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                        {disasterAlerts.map((dis) => (
                            <div key={dis.id} className="disaster-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                    <div>
                                        <span className="disaster-tag">{dis.event_type}</span>
                                        <span style={{ marginLeft: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                                            📍 Area: {dis.affected_area} (AQI Impact: {dis.aqi})
                                        </span>
                                    </div>
                                    <span className="priority-badge">{dis.priority} Priority</span>
                                </div>
                                <div className="disaster-advice">
                                    🛡️ <strong>Safety Advisory:</strong> {dis.safety_advice}
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.72rem', marginTop: 6 }}>
                                    Source: {dis.source} • Registered: {formatDate(dis.created_at)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && displayedAlerts.length === 0 && (
                <div className="state-box">
                    <span style={{ fontSize: '1.8rem' }}>✅</span>
                    <span>No {filterTab !== 'all' ? filterTab : ''} alerts found for <strong>{location}</strong>.</span>
                    <span className="text-muted">
                        Alerts trigger when AQI exceeds the threshold or spikes by &gt;100 points in &lt;3 hours.
                    </span>
                </div>
            )}

            {/* Alerts List */}
            {displayedAlerts.length > 0 && (
                <div className="alert-list">
                    {displayedAlerts.map((alert) => {
                        const isActive = alert.status === 'active'
                        const isSpike = alert.alert_type === 'spike'

                        return (
                            <div
                                key={alert.id}
                                className={`alert-card ${isActive ? 'active' : 'acknowledged'} ${isSpike ? 'spike-card' : ''}`}
                            >
                                <div className="alert-card-body">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                                        {getAlertBadge(alert.alert_type)}
                                        <span className={`severity-badge ${isActive ? 'sev-unhealthy' : 'sev-moderate'}`} style={{ fontSize: '0.72rem' }}>
                                            {alert.severity || 'Unhealthy'}
                                        </span>
                                        <span className={`status-pill ${alert.status}`}>
                                            {alert.status}
                                        </span>
                                    </div>

                                    {/* Primary Alert Message */}
                                    <div className="alert-message">
                                        {alert.message}
                                    </div>

                                    {/* Plain Language Health Advice (Module 5 SRS Requirement) */}
                                    {alert.health_advice && (
                                        <div className="alert-health-advice">
                                            🩺 <strong>Health Guidance:</strong> {alert.health_advice}
                                        </div>
                                    )}

                                    {/* Alert Metadata */}
                                    <div className="alert-meta" style={{ marginTop: 8 }}>
                                        <span>📍 {alert.location}</span>
                                        <span>💨 Reading AQI: <strong>{alert.aqi}</strong></span>
                                        {alert.threshold_value && (
                                            <span>🎯 Threshold: {alert.threshold_value}</span>
                                        )}
                                        <span>🕐 Created: {formatDate(alert.created_at)}</span>
                                        {alert.acknowledged_at && (
                                            <span style={{ color: '#059669' }}>
                                                ✓ Acked: {formatDate(alert.acknowledged_at)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Persistent Acknowledgement Button */}
                                {isActive && (
                                    <button
                                        id={`btn-ack-${alert.id}`}
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleAcknowledge(alert.id)}
                                        disabled={ackLoading[alert.id]}
                                        style={{ flexShrink: 0, alignSelf: 'center' }}
                                    >
                                        {ackLoading[alert.id] ? 'Saving…' : '✓ Acknowledge'}
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
