// ThresholdConfig.jsx — AQI threshold configuration (Module 5)
// Designed for a single-user application: persists to MySQL, validates input, and controls alert generation.

import React, { useState, useEffect } from 'react'

export default function ThresholdConfig({ locations, selectedLocation, apiBase, onThresholdUpdated }) {
    const [location, setLocation] = useState(selectedLocation)
    const [threshold, setThreshold] = useState(100)
    const [enabled, setEnabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null)

    // Sync when primary location changes
    useEffect(() => {
        setLocation(selectedLocation)
    }, [selectedLocation])

    useEffect(() => {
        if (location) {
            fetchThreshold(location)
        }
    }, [location])

    async function fetchThreshold(loc) {
        if (!loc) return
        setLoading(true)
        setMessage(null)
        try {
            const res = await fetch(`${apiBase}/api/thresholds?location=${encodeURIComponent(loc)}`)
            if (res.ok) {
                const data = await res.json()
                setThreshold(data.threshold_value ?? 100)
                setEnabled(data.enabled === 1 || data.enabled === true)
            }
        } catch {
            setMessage({ type: 'error', text: 'Could not load threshold from backend.' })
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e) {
        e.preventDefault()
        if (!location) return
        const val = parseInt(threshold, 10)
        if (isNaN(val) || val < 0) {
            setMessage({ type: 'error', text: 'Threshold must be a non-negative integer.' })
            return
        }
        setSaving(true)
        setMessage(null)
        try {
            const res = await fetch(`${apiBase}/api/thresholds`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location, threshold_value: val, enabled }),
            })
            const data = await res.json()
            if (res.ok) {
                setMessage({
                    type: 'success',
                    text: `✅ Configuration saved for ${location}: AQI alert threshold = ${val} (Monitoring ${enabled ? 'ACTIVE' : 'DISABLED'})`,
                })
                if (onThresholdUpdated) onThresholdUpdated()
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save threshold.' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Verify that the backend is running.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="section" id="threshold-config-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">⚙️</span>
                        AQI Alert Threshold Configuration
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Single-account alert rule engine — defines when automated warnings are dispatched
                    </span>
                </div>
                <span className="status-pill acknowledged" style={{ fontSize: '0.72rem' }}>
                    Single-Account Mode
                </span>
            </div>

            {message && (
                <div className={`alert-banner ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="form-grid-2">
                    {/* Location selector */}
                    <div className="form-group mb-0">
                        <label htmlFor="thresh-location">Target Location</label>
                        <select
                            id="thresh-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={loading}
                        >
                            {locations.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>

                    {/* Threshold value */}
                    <div className="form-group mb-0">
                        <label htmlFor="thresh-value">AQI Warning Threshold (0 - 500)</label>
                        <input
                            id="thresh-value"
                            type="number"
                            min="0"
                            max="500"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            disabled={loading}
                            placeholder="e.g. 100"
                            required
                        />
                    </div>
                </div>

                {/* Enable / Disable toggle */}
                <div className="toggle-row mt-16">
                    <div>
                        <div className="toggle-label-text">
                            Threshold Monitoring State: <strong>{enabled ? 'ENABLED' : 'DISABLED'}</strong>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.80rem', marginTop: 2 }}>
                            {enabled
                                ? 'Automated alerts will trigger whenever a newly registered reading exceeds this threshold.'
                                : 'Alert generation is suppressed for this location. Readings will be logged without triggering alerts.'}
                        </div>
                    </div>
                    <label className="toggle-switch" id="toggle-monitoring">
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                    </label>
                </div>

                <div className="row" style={{ marginTop: 16 }}>
                    <button
                        id="btn-save-threshold"
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving to Database…' : '💾 Save Threshold Configuration'}
                    </button>
                    {loading && <span className="text-muted" style={{ fontSize: '0.85rem' }}>Loading settings from MySQL…</span>}
                </div>
            </form>
        </section>
    )
}
