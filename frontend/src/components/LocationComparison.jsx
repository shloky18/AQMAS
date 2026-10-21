// LocationComparison.jsx — Location selection, multi-city comparison, and station map (Module 3)
// Supports selecting and comparing up to 3 locations with trends and station markers.

import React, { useState, useEffect } from 'react'
import IndiaMap from '@svg-maps/india'

const CITY_COORDINATES = {
    Mumbai:    { x: 108, y: 418, state: 'Maharashtra', lat: '19.0760° N', lng: '72.8777° E' },
    Delhi:     { x: 188, y: 210, state: 'National Capital', lat: '28.6139° N', lng: '77.2090° E' },
    Pune:      { x: 130, y: 440, state: 'Maharashtra', lat: '18.5204° N', lng: '73.8567° E' },
    Bangalore: { x: 185, y: 555, state: 'Karnataka', lat: '12.9716° N', lng: '77.5946° E' },
}

const LINE_COLORS = ['#2563eb', '#16a34a', '#dc2626']

export default function LocationComparison({ locations = [], primaryLocation, onSelectPrimary, apiBase }) {
    const [selectedCompare, setSelectedCompare] = useState(['Mumbai', 'Delhi', 'Pune'])
    const [compareData, setCompareData] = useState({})
    const [loading, setLoading] = useState(false)
    const [range, setRange] = useState('week')
    const [error, setError] = useState(null)
    const [isFullScreen, setIsFullScreen] = useState(false)

    // Listen for Escape key to exit fullscreen and toggle body scroll lock
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsFullScreen(false)
        }
        if (isFullScreen) {
            document.body.style.overflow = 'hidden'
            window.addEventListener('keydown', handleKeyDown)
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isFullScreen])

    const toggleNativeFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {})
        } else if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {})
        }
    }

    // Ensure selected comparison does not exceed 3
    const toggleLocation = (loc) => {
        if (selectedCompare.includes(loc)) {
            if (selectedCompare.length === 1) return // Keep at least one
            setSelectedCompare(selectedCompare.filter((l) => l !== loc))
        } else {
            if (selectedCompare.length >= 3) {
                // Replace last one or max 3
                setSelectedCompare([...selectedCompare.slice(1), loc])
            } else {
                setSelectedCompare([...selectedCompare, loc])
            }
        }
    }

    useEffect(() => {
        if (selectedCompare.length === 0) return
        fetchComparison()
    }, [selectedCompare, range])

    async function fetchComparison() {
        setLoading(true)
        setError(null)
        try {
            const locList = selectedCompare.join(',')
            const res = await fetch(`${apiBase}/api/air-quality/compare?locations=${encodeURIComponent(locList)}&range=${range}`)
            if (res.ok) {
                const json = await res.json()
                setCompareData(json.data || {})
            } else {
                setError('Failed to load comparison data.')
            }
        } catch {
            setError('Network error while comparing locations.')
        } finally {
            setLoading(false)
        }
    }

    // Helper to render interactive SVG map in both standard and fullscreen views
    const renderMapSvg = (isDark = false) => {
        const landFill = isDark ? '#1e293b' : '#f1f5f9'
        const landStroke = isDark ? '#334155' : '#cbd5e1'
        const landStrokeWidth = isDark ? '0.9' : '0.8'

        return (
            <svg
                viewBox={IndiaMap.viewBox || '0 0 612 696'}
                className="map-svg"
                style={{
                    width: '100%',
                    height: '100%',
                    maxHeight: isDark ? 'calc(100vh - 120px)' : '520px',
                    filter: isDark ? 'drop-shadow(0 4px 24px rgba(0,0,0,0.5))' : 'none',
                }}
            >
                <defs>
                    <filter id={`glow-${isDark ? 'dark' : 'light'}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Vector State Boundaries of India */}
                <g className={`india-states-group ${isDark ? 'dark' : ''}`}>
                    {IndiaMap.locations.map((state) => (
                        <path
                            key={state.id}
                            id={state.id}
                            d={state.path}
                            fill={landFill}
                            stroke={landStroke}
                            strokeWidth={landStrokeWidth}
                            style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }}
                        >
                            <title>{state.name}</title>
                        </path>
                    ))}
                </g>

                {/* City Station Markers with Live Radar Pulse */}
                {locations.map((loc) => {
                    const coords = CITY_COORDINATES[loc] || { x: 180, y: 300, lat: '—', lng: '—' }
                    const locInfo = compareData[loc]
                    const aqi = locInfo && locInfo.latest ? locInfo.latest.aqi : null
                    const isFocused = loc === primaryLocation

                    const pinColor = !aqi
                        ? '#94a3b8'
                        : aqi <= 50
                        ? '#16a34a'
                        : aqi <= 100
                        ? '#d97706'
                        : aqi <= 150
                        ? '#ea580c'
                        : aqi <= 200
                        ? '#dc2626'
                        : '#9333ea'

                    const labelWidth = loc.length * 7.5 + (aqi ? 38 : 14)

                    return (
                        <g
                            key={loc}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onSelectPrimary(loc)}
                        >
                            {/* Animated Outer Radar Pulse */}
                            <circle
                                cx={coords.x}
                                cy={coords.y}
                                r={isFocused ? 22 : 14}
                                fill={pinColor}
                                opacity="0.3"
                            >
                                <animate
                                    attributeName="r"
                                    values={isFocused ? '10;28;10' : '7;20;7'}
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                />
                                <animate
                                    attributeName="opacity"
                                    values="0.5;0.05;0.5"
                                    dur="2.4s"
                                    repeatCount="indefinite"
                                />
                            </circle>

                            {/* Inner Highlight Pulse */}
                            <circle
                                cx={coords.x}
                                cy={coords.y}
                                r={isFocused ? 11 : 7}
                                fill={pinColor}
                                opacity="0.5"
                            />

                            {/* Solid Center Node */}
                            <circle
                                cx={coords.x}
                                cy={coords.y}
                                r={isFocused ? 6 : 4.5}
                                fill={pinColor}
                                stroke={isDark ? '#0f172a' : '#ffffff'}
                                strokeWidth="2"
                                filter={`url(#glow-${isDark ? 'dark' : 'light'})`}
                            />

                            {/* Floating Station Info Badge */}
                            <rect
                                x={coords.x + 8}
                                y={coords.y - 11}
                                width={labelWidth}
                                height="22"
                                rx="4"
                                fill={isDark ? '#0f172a' : '#1e293b'}
                                stroke={isFocused ? pinColor : 'rgba(255,255,255,0.2)'}
                                strokeWidth={isFocused ? 1.5 : 0.8}
                                opacity="0.95"
                            />

                            <text
                                x={coords.x + 13}
                                y={coords.y + 4}
                                fontSize="10.5"
                                fontWeight="600"
                                fill="#ffffff"
                                fontFamily="system-ui, -apple-system, sans-serif"
                            >
                                {loc} {aqi ? `(${aqi})` : ''}
                            </text>
                        </g>
                    )
                })}
            </svg>
        )
    }

    return (
        <section className="section" id="location-comparison-section">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">⚖️</span>
                        Location Comparison & Regional Station Map
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Select up to 3 locations to compare live AQI metrics and historical trajectories side-by-side
                    </span>
                </div>

                <div className="filter-button-group">
                    <button
                        className={`btn-filter ${range === 'day' ? 'active' : ''}`}
                        onClick={() => setRange('day')}
                    >
                        24 Hours
                    </button>
                    <button
                        className={`btn-filter ${range === 'week' ? 'active' : ''}`}
                        onClick={() => setRange('week')}
                    >
                        7 Days
                    </button>
                    <button
                        className={`btn-filter ${range === 'month' ? 'active' : ''}`}
                        onClick={() => setRange('month')}
                    >
                        30 Days
                    </button>
                </div>
            </div>

            {/* Location Selector Chips */}
            <div style={{ marginBottom: 16 }}>
                <span className="text-muted" style={{ fontSize: '0.82rem', marginRight: 10 }}>
                    Select up to 3 cities (Active: {selectedCompare.length}/3):
                </span>
                <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                    {locations.map((loc) => {
                        const isSelected = selectedCompare.includes(loc)
                        return (
                            <button
                                key={loc}
                                type="button"
                                className={`loc-chip ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleLocation(loc)}
                            >
                                📍 {loc} {isSelected && '✓'}
                            </button>
                        )
                    })}
                </div>
            </div>

            {error && <div className="alert-banner error">{error}</div>}

            {/* Side-by-Side Comparison Cards */}
            <div className="comparison-cards-grid">
                {selectedCompare.map((loc, idx) => {
                    const locInfo = compareData[loc]
                    const latest = locInfo ? locInfo.latest : null
                    const color = LINE_COLORS[idx % LINE_COLORS.length]

                    return (
                        <div key={loc} className="comparison-card" style={{ borderTop: `4px solid ${color}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{loc}</h3>
                                {loc === primaryLocation && (
                                    <span className="status-pill active" style={{ fontSize: '0.68rem' }}>Dashboard Active</span>
                                )}
                            </div>

                            {latest ? (
                                <>
                                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                        <span style={{ fontSize: '2.2rem', fontWeight: 800, color }}>{latest.aqi}</span>
                                        <span className="text-muted" style={{ fontSize: '0.82rem' }}>AQI</span>
                                        <span className="severity-badge sev-moderate" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                                            {latest.severity}
                                        </span>
                                    </div>

                                    <div className="comp-pollutants-row">
                                        <div>
                                            <span className="comp-sub-label">PM2.5:</span>
                                            <strong style={{ fontSize: '0.85rem' }}> {latest.pm25 !== null ? parseFloat(latest.pm25).toFixed(1) : 'N/A'}</strong>
                                        </div>
                                        <div>
                                            <span className="comp-sub-label">PM10:</span>
                                            <strong style={{ fontSize: '0.85rem' }}> {latest.pm10 !== null ? parseFloat(latest.pm10).toFixed(1) : 'N/A'}</strong>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        style={{ marginTop: 14, width: '100%' }}
                                        onClick={() => onSelectPrimary(loc)}
                                    >
                                        🔍 Focus Dashboard on {loc}
                                    </button>
                                </>
                            ) : (
                                <div className="state-box" style={{ padding: '20px 0' }}>
                                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                                        {loading ? 'Loading…' : 'No recent reading for this city'}
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Multi-Location Comparative Historical Trends Chart */}
            <div className="comp-chart-box" style={{ marginTop: 20, padding: 18, background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                            📈 Comparative Historical Trajectories ({range.toUpperCase()})
                        </h3>
                        <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                            Superimposed historical trends comparing {selectedCompare.join(' vs ')}
                        </span>
                    </div>

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        {selectedCompare.map((loc, idx) => (
                            <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.80rem' }}>
                                <span style={{ width: 14, height: 4, background: LINE_COLORS[idx % LINE_COLORS.length], borderRadius: 2 }} />
                                <strong>{loc}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Comparative SVG Line Chart */}
                {(() => {
                    const allPoints = selectedCompare.flatMap((loc) => (compareData[loc] && compareData[loc].history) || [])
                    if (allPoints.length === 0) {
                        return (
                            <div className="state-box" style={{ padding: '30px 0' }}>
                                <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                                    {loading ? 'Loading comparative trajectories…' : 'No comparative history available for the selected range.'}
                                </span>
                            </div>
                        )
                    }

                    const cWidth = 800
                    const cHeight = 220
                    const cPad = { top: 20, right: 25, bottom: 35, left: 45 }
                    const pW = cWidth - cPad.left - cPad.right
                    const pH = cHeight - cPad.top - cPad.bottom

                    const maxVal = Math.max(220, Math.ceil((Math.max(...allPoints.map((p) => p.aqi), 100) + 30) / 50) * 50)
                    const getY = (val) => cPad.top + pH - (val / maxVal) * pH

                    return (
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                            <svg viewBox={`0 0 ${cWidth} ${cHeight}`} style={{ width: '100%', minWidth: 550, height: 'auto' }}>
                                {[50, 100, 150, 200, 300].filter((lvl) => lvl <= maxVal).map((lvl) => (
                                    <g key={lvl}>
                                        <line x1={cPad.left} y1={getY(lvl)} x2={cWidth - cPad.right} y2={getY(lvl)} stroke="#e2e8f0" strokeDasharray="3 3" />
                                        <text x={cPad.left - 6} y={getY(lvl) + 3} textAnchor="end" fontSize="10" fill="#94a3b8">{lvl}</text>
                                    </g>
                                ))}

                                <line x1={cPad.left} y1={cPad.top + pH} x2={cWidth - cPad.right} y2={cPad.top + pH} stroke="#cbd5e1" strokeWidth="1.5" />

                                {selectedCompare.map((loc, idx) => {
                                    const locHist = (compareData[loc] && compareData[loc].history) || []
                                    if (locHist.length === 0) return null
                                    const locColor = LINE_COLORS[idx % LINE_COLORS.length]

                                    const pts = locHist.map((h, i) => {
                                        const x = cPad.left + (locHist.length <= 1 ? pW / 2 : (i / (locHist.length - 1)) * pW)
                                        const y = getY(h.aqi)
                                        return `${x},${y}`
                                    }).join(' ')

                                    return (
                                        <g key={loc}>
                                            <polyline
                                                fill="none"
                                                stroke={locColor}
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                points={pts}
                                            />
                                            {locHist.map((h, i) => {
                                                const cx = cPad.left + (locHist.length <= 1 ? pW / 2 : (i / (locHist.length - 1)) * pW)
                                                const cy = getY(h.aqi)
                                                return (
                                                    <circle
                                                        key={i}
                                                        cx={cx}
                                                        cy={cy}
                                                        r="3.5"
                                                        fill={locColor}
                                                        stroke="#ffffff"
                                                        strokeWidth="1.5"
                                                    />
                                                )
                                            })}
                                        </g>
                                    )
                                })}
                            </svg>
                        </div>
                    )
                })()}
            </div>

            {/* Regional Station Map (Module 3 Map Markers Requirement) */}
            <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <div>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🗺️</span> Regional Monitoring Station Network
                        </h3>
                        <span className="text-muted" style={{ fontSize: '0.80rem' }}>
                            Vector GIS boundaries of India with real-time station radar coordinates. Click pin or card to focus dashboard.
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            onClick={() => setIsFullScreen(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, padding: '6px 14px' }}
                            title="Expand India map to full screen view"
                        >
                            <span>⛶</span> Full Screen Map
                        </button>
                    </div>
                </div>

                <div className="map-view-wrapper">
                    <div className="map-canvas-container">
                        {renderMapSvg(false)}
                    </div>

                    {/* Active Sensor Nodes Grid */}
                    <div className="map-stations-grid">
                        {locations.map((loc) => {
                            const coords = CITY_COORDINATES[loc] || { lat: '—', lng: '—', state: 'India' }
                            const locInfo = compareData[loc]
                            const latest = locInfo ? locInfo.latest : null
                            const isPrimary = loc === primaryLocation

                            return (
                                <div
                                    key={loc}
                                    className={`station-item ${isPrimary ? 'active' : ''}`}
                                    onClick={() => onSelectPrimary(loc)}
                                    title={`Click to focus dashboard on ${loc}`}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                            {loc} {isPrimary && '🎯'}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                            Coords: {coords.lat}, {coords.lng}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                            {latest ? latest.aqi : '—'}
                                        </div>
                                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                                            {latest ? latest.severity : 'Standby'}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Fullscreen Overlay Modal (Module 3 Fullscreen GIS Requirement) */}
            {isFullScreen && (
                <div className="map-fullscreen-overlay">
                    <div className="map-fullscreen-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: '1.4rem' }}>🗺️</span>
                            <div>
                                <h2 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>
                                    AQMAS National Air Quality Telemetry Network — Fullscreen GIS View
                                </h2>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                    High-Precision Vector Boundaries • Press ESC or Click Exit to Close
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                style={{ background: '#1e293b', color: '#f8fafc', borderColor: '#334155' }}
                                onClick={toggleNativeFullscreen}
                                title="Toggle browser window F11 fullscreen"
                            >
                                🖥️ F11 Window
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={() => setIsFullScreen(false)}
                            >
                                ✕ Exit Fullscreen (Esc)
                            </button>
                        </div>
                    </div>

                    <div className="map-fullscreen-body">
                        {/* Interactive Large Vector Map */}
                        <div className="map-fullscreen-svg-wrap">
                            {renderMapSvg(true)}
                        </div>

                        {/* Station Telemetry Sidebar */}
                        <div className="map-fullscreen-sidebar">
                            <div style={{ paddingBottom: 8, borderBottom: '1px solid #1e293b' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                                    Active Sensor Telemetry
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    Click any station node to switch primary dashboard focus
                                </div>
                            </div>

                            {locations.map((loc) => {
                                const coords = CITY_COORDINATES[loc] || { lat: '—', lng: '—', state: 'India' }
                                const locInfo = compareData[loc]
                                const latest = locInfo ? locInfo.latest : null
                                const isPrimary = loc === primaryLocation

                                return (
                                    <div
                                        key={loc}
                                        className={`station-fs-card ${isPrimary ? 'active' : ''}`}
                                        onClick={() => onSelectPrimary(loc)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                                                    {loc} {isPrimary && '🎯'}
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                                                    {coords.lat}, {coords.lng}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#60a5fa' }}>
                                                    {latest ? latest.aqi : '—'}
                                                </div>
                                                <div style={{ fontSize: '0.70rem', color: '#94a3b8' }}>
                                                    {latest ? latest.severity : 'Standby'}
                                                </div>
                                            </div>
                                        </div>

                                        {latest && (
                                            <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 6, borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                                <div>PM2.5: <strong>{latest.pm25 !== null ? parseFloat(latest.pm25).toFixed(1) : 'N/A'}</strong></div>
                                                <div>PM10: <strong>{latest.pm10 !== null ? parseFloat(latest.pm10).toFixed(1) : 'N/A'}</strong></div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
