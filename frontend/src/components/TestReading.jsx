// TestReading — form to submit a simulated AQI reading to the backend
// This is necessary for demonstrating the project without a live AQI API feed

import { useState } from 'react'

export default function TestReading({ locations, apiBase, onSubmitSuccess }) {
    const [location, setLocation] = useState(locations[0] || 'Mumbai')
    const [aqi, setAqi] = useState('')
    const [pm25, setPm25] = useState('')
    const [pm10, setPm10] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)  // { type, text, alert }

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

        setLoading(true)
        try {
            const res = await fetch(`${apiBase}/api/air-quality`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location, aqi: aqiNum, pm25: pm25Num, pm10: pm10Num }),
            })
            const data = await res.json()
            if (res.ok) {
                const alertMsg = data.alertGenerated
                    ? `🚨 Alert generated! AQI ${aqiNum} exceeded the threshold.`
                    : `✅ Reading saved. AQI ${aqiNum} did not exceed the threshold — no alert generated.`
                setResult({ type: data.alertGenerated ? 'warning' : 'success', text: alertMsg, data })
                // Clear form inputs
                setAqi('')
                setPm25('')
                setPm10('')
                // Notify parent to refresh dashboard
                onSubmitSuccess()
            } else {
                setResult({ type: 'error', text: data.error || 'Failed to submit reading.' })
            }
        } catch {
            setResult({ type: 'error', text: 'Network error. Is the backend running?' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <section className="section" id="test-reading">
            <h2 className="section-title">
                <span className="icon">🧪</span>
                Submit Test Reading
            </h2>
            <p className="text-muted" style={{ marginBottom: 18 }}>
                Use this form to simulate incoming pollution data and demonstrate the alert system.
                This is for demonstration only — not live measurements.
            </p>

            {result && (
                <div className={`alert-banner ${result.type}`} id="test-result-banner">
                    {result.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                    <div className="form-group">
                        <label htmlFor="test-location">Location</label>
                        <select
                            id="test-location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={loading}
                        >
                            {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-grid-3">
                    <div className="form-group mb-0">
                        <label htmlFor="test-aqi">AQI Value</label>
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
                        <label htmlFor="test-pm25">PM2.5 (µg/m³)</label>
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
                        <label htmlFor="test-pm10">PM10 (µg/m³)</label>
                        <input
                            id="test-pm10"
                            type="number"
                            min="0"
                            step="0.1"
                            value={pm10}
                            onChange={(e) => setPm10(e.target.value)}
                            placeholder="e.g. 120.0"
                            disabled={loading}
                            required
                        />
                    </div>
                </div>

                <div className="row mt-16">
                    <button
                        id="btn-submit-reading"
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Submitting…' : '📤 Submit Reading'}
                    </button>
                    <span className="text-muted">
                        The backend will check the threshold and generate an alert if AQI exceeds it.
                    </span>
                </div>
            </form>
        </section>
    )
}
