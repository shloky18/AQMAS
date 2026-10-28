// TestReading.jsx — Interactive Test Reading Simulation & Viva Demo Scenarios
// Enables controlled demonstration of Threshold alerts, Cooldown duplicate suppression, and Sudden Spikes.

import React, { useState } from 'react'

export default function TestReading({ locations, selectedLocation, apiBase, onSubmitSuccess }) {
    const [location, setLocation] = useState(selectedLocation || locations[0] || 'Mumbai')
    const [aqi, setAqi] = useState('')
    const [pm25, setPm25] = useState('')
    const [pm10, setPm10] = useState('')
    const [co, setCo] = useState('')
    const [no2, setNo2] = useState('')
    const [so2, setSo2] = useState('')
    const [o3, setO3] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    // Sync location if prop changes
    React.useEffect(() => {
        if (selectedLocation) setLocation(selectedLocation)
    }, [selectedLocation])

    // Demonstration Quick Presets
    const applyPreset = (presetType) => {
        setResult(null)
        if (presetType === 'breach') {
            // Scenario A: AQI 156 > 100 (Threshold alert)
            setAqi('156')
            setPm25('68.5')
            setPm10('120.3')
            setCo('1.5')
            setNo2('45.0')
            setSo2('12.0')
            setO3('30.0')
        } else if (presetType === 'safe') {
            // Scenario B: AQI 65 <= 100 (Normal safe reading)
            setAqi('65')
            setPm25('22.0')
            setPm10('50.0')
            setCo('0.6')
            setNo2('18.0')
            setSo2('')
            setO3('')
        } else if (presetType === 'spike') {
            // Sudden Spike: AQI 220 (>100 jump)
            setAqi('220')
            setPm25('98.0')
            setPm10('185.0')
            setCo('2.4')
            setNo2('70.0')
            setSo2('22.0')
            setO3('45.0')
        }
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setResult(null)

        const aqiNum = parseInt(aqi, 10)
        const pm25Num = parseFloat(pm25)
        const pm10Num = parseFloat(pm10)

        if (!location) return setResult({ type: 'error', text: 'Please select a location.' })
        if (isNaN(aqiNum) || aqiNum < 0) return setResult({ type: 'error', text: 'AQI must be a non-negative integer.' })
        if (isNaN(pm25Num) || pm25Num < 0) return setResult({ type: 'error', text: 'PM2.5 must be a non-negative number.' })
        if (isNaN(pm10Num) || pm10Num < 0) return setResult({ type: 'error', text: 'PM10 must be a non-negative number.' })

        const payload = {
            location,
            aqi: aqiNum,
            pm25: pm25Num,
            pm10: pm10Num,
            co: co !== '' ? parseFloat(co) : null,
            no2: no2 !== '' ? parseFloat(no2) : null,
            so2: so2 !== '' ? parseFloat(so2) : null,
            o3: o3 !== '' ? parseFloat(o3) : null,
        }

        setLoading(true)
        try {
            const res = await fetch(`${apiBase}/api/air-quality`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (res.ok) {
                let alertBannerType = 'success'
                let bannerMessage = data.message

                if (data.alertGenerated) {
                    alertBannerType = 'warning'
                } else if (data.duplicateSuppressed) {
                    alertBannerType = 'info'
                    bannerMessage = `ℹ️ Reading logged (AQI ${aqiNum}). Threshold breach occurred, but duplicate alert was suppressed by the 3-hour cooldown.`
                }

                setResult({
                    type: alertBannerType,
                    text: bannerMessage,
                    data,
                })

                // Notify parent to refresh dashboard & alerts
                onSubmitSuccess()
            } else {
                setResult({ type: 'error', text: data.error || 'Failed to submit reading.' })
            }
        } catch {
            setResult({ type: 'error', text: 'Network error. Verify that the backend is running.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="section" id="test-reading-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">🧪</span>
                        Simulate Reading & Demonstration Console
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Simulate incoming sensor telemetry
                    </span>
                </div>
            </div>

            {/* Quick Demo Scenario Presets */}
            <div className="demo-presets-bar">
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}> Test Presets:</span>
                <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => applyPreset('breach')}
                >
                    ⚡ Scenario A: Breach (AQI 156)
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => applyPreset('safe')}
                >
                    🍃 Scenario B: Safe (AQI 65)
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => applyPreset('spike')}
                >
                    🚀 Scenario C: Sudden Spike (AQI 220)
                </button>
            </div>

            {result && (
                <div className={`alert-banner ${result.type}`} id="test-result-banner" style={{ marginTop: 14 }}>
                    {result.text}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 14 }}>
                    <div className="form-group">
                        <label htmlFor="test-location">Location</label>
                        <select
                            id="test-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={loading}
                        >
                            {locations.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Core Pollutants */}
                <div className="form-grid-3">
                    <div className="form-group mb-0">
                        <label htmlFor="test-aqi">AQI Value *</label>
                        <input
                            id="test-aqi"
                            type="number"
                            min="0"
                            max="500"
                            value={aqi}
                            onChange={(e) => setAqi(e.target.value)}
                            placeholder="e.g. 156"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="form-group mb-0">
                        <label htmlFor="test-pm25">PM2.5 (µg/m³) *</label>
                        <input
                            id="test-pm25"
                            type="number"
                            min="0"
                            step="0.1"
                            value={pm25}
                            onChange={(e) => setPm25(e.target.value)}
                            placeholder="e.g. 68.5"
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="form-group mb-0">
                        <label htmlFor="test-pm10">PM10 (µg/m³) *</label>
                        <input
                            id="test-pm10"
                            type="number"
                            min="0"
                            step="0.1"
                            value={pm10}
                            onChange={(e) => setPm10(e.target.value)}
                            placeholder="e.g. 120.3"
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                {/* Optional Extended Pollutants (Module 3) */}
                <div style={{ marginTop: 12 }}>
                    <button
                        type="button"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? '▲ Hide Optional Pollutants (CO, NO2, SO2, O3)' : '▼ Add Monitored Pollutants (CO, NO2, SO2, O3)'}
                    </button>
                </div>

                {showAdvanced && (
                    <div className="form-grid-2" style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                        <div className="form-group mb-0">
                            <label htmlFor="test-co">CO (Carbon Monoxide - mg/m³)</label>
                            <input
                                id="test-co"
                                type="number"
                                min="0"
                                step="0.01"
                                value={co}
                                onChange={(e) => setCo(e.target.value)}
                                placeholder="e.g. 1.25 (optional)"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label htmlFor="test-no2">NO2 (Nitrogen Dioxide - µg/m³)</label>
                            <input
                                id="test-no2"
                                type="number"
                                min="0"
                                step="0.1"
                                value={no2}
                                onChange={(e) => setNo2(e.target.value)}
                                placeholder="e.g. 38.0 (optional)"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label htmlFor="test-so2">SO2 (Sulfur Dioxide - µg/m³)</label>
                            <input
                                id="test-so2"
                                type="number"
                                min="0"
                                step="0.1"
                                value={so2}
                                onChange={(e) => setSo2(e.target.value)}
                                placeholder="e.g. 12.5 (optional)"
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label htmlFor="test-o3">O3 (Ozone - µg/m³)</label>
                            <input
                                id="test-o3"
                                type="number"
                                min="0"
                                step="0.1"
                                value={o3}
                                onChange={(e) => setO3(e.target.value)}
                                placeholder="e.g. 28.0 (optional)"
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                <div className="row" style={{ marginTop: 16 }}>
                    <button
                        id="btn-submit-reading"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Submitting & Evaluating…' : '📤 Submit Telemetry Reading'}
                    </button>
                    <span className="text-muted" style={{ fontSize: '0.80rem' }}>
                        Reading Evaluated
                    </span>
                </div>
            </form>
        </section>
    )
}
