// ThresholdConfig — lets user set/update AQI threshold for a location

import { useState, useEffect } from 'react'

export default function ThresholdConfig({ locations, selectedLocation, apiBase }) {
    const [location, setLocation] = useState(selectedLocation)
    const [threshold, setThreshold] = useState(100)
    const [enabled, setEnabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState(null) // { type, text }

    // Load threshold when location changes
    useEffect(() => {
        setLocation(selectedLocation)
    }, [selectedLocation])

    useEffect(() => {
        fetchThreshold(location)
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
            setMessage({ type: 'error', text: 'Could not load threshold. Is the backend running?' })
        } finally {
            setLoading(false)
        }
    }

    async function handleSave(e) {
        e.preventDefault()
        if (!location) return
        const val = parseInt(threshold, 10)
        if (isNaN(val) || val < 0) {
            setMessage({ type: 'error', text: 'Threshold must be a non-negative number.' })
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
                setMessage({ type: 'success', text: `✅ Threshold saved for ${location}: AQI > ${val} (monitoring ${enabled ? 'enabled' : 'disabled'})` })
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save threshold.' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Check if backend is running.' })
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="section">
            <h2 className="section-title">
                <span className="icon">⚙️</span>
                AQI Threshold Configuration
            </h2>

            {message && (
                <div className={`alert-banner ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSave}>
                <div className="form-grid-2">
                    {/* Location selector */}
                    <div className="form-group mb-0">
                        <label htmlFor="thresh-location">Location</label>
                        <select
                            id="thresh-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={loading}
                        >
                            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>

                    {/* Threshold value */}
                    <div className="form-group mb-0">
                        <label htmlFor="thresh-value">AQI Threshold Value</label>
                        <input
                            id="thresh-value"
                            type="number"
                            min="0"
                            max="500"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            disabled={loading}
                            placeholder="e.g. 100"
                        />
                    </div>
                </div>

                {/* Enable toggle */}
                <div className="toggle-row mt-16">
                    <div>
                        <div className="toggle-label-text">Threshold Monitoring</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                            {enabled
                                ? 'Alerts will be generated when AQI exceeds the threshold above.'
                                : 'Monitoring is disabled. No alerts will be generated.'}
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

                <div className="row">
                    <button
                        id="btn-save-threshold"
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving…' : '💾 Save Threshold'}
                    </button>
                    {loading && <span className="text-muted">Loading current threshold…</span>}
                </div>
            </form>
        </section>
    )
}
