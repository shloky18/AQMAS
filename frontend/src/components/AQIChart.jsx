// AQIChart.jsx — Interactive Historical AQI Visualization (Module 3)
// Features Day, Week, and Month filters, clear timestamps, value tooltips, and statistical benchmarks.

import React, { useState } from 'react'

function formatDate(ts, range) {
    if (!ts) return ''
    const d = new Date(ts)
    if (range === 'day') {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    if (range === 'week') {
        return `${d.toLocaleDateString([], { weekday: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit' })}`
    }
    return `${d.getDate()}/${d.getMonth() + 1} ${d.toLocaleTimeString([], { hour: '2-digit' })}`
}

export default function AQIChart({ history = [], loading, location, range, onRangeChange }) {
    const [hoveredPoint, setHoveredPoint] = useState(null)

    // Sort chronologically for charting
    const sortedData = [...history].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))

    // Summary calculations
    const aqiValues = sortedData.map((d) => d.aqi)
    const minAqi = aqiValues.length > 0 ? Math.min(...aqiValues) : 0
    const maxAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : 0
    const avgAqi = aqiValues.length > 0 ? Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length) : 0

    // Chart dimensions
    const width = 800
    const height = 280
    const padding = { top: 30, right: 30, bottom: 40, left: 50 }
    const plotWidth = width - padding.left - padding.right
    const plotHeight = height - padding.top - padding.bottom

    const chartMaxY = Math.max(250, Math.ceil((maxAqi + 40) / 50) * 50)
    const chartMinY = 0

    const getY = (val) => {
        return padding.top + plotHeight - ((val - chartMinY) / (chartMaxY - chartMinY)) * plotHeight
    }

    const getX = (idx, total) => {
        if (total <= 1) return padding.left + plotWidth / 2
        return padding.left + (idx / (total - 1)) * plotWidth
    }

    // Build SVG polyline points
    const pointsString = sortedData
        .map((d, i) => `${getX(i, sortedData.length)},${getY(d.aqi)}`)
        .join(' ')

    // Build closed area path
    const areaPath = sortedData.length > 0
        ? `M ${getX(0, sortedData.length)},${getY(sortedData[0].aqi)} ` +
          sortedData.map((d, i) => `L ${getX(i, sortedData.length)},${getY(d.aqi)}`).join(' ') +
          ` L ${getX(sortedData.length - 1, sortedData.length)},${padding.top + plotHeight} ` +
          ` L ${getX(0, sortedData.length)},${padding.top + plotHeight} Z`
        : ''

    const yLevels = [50, 100, 150, 200, 300].filter((lvl) => lvl <= chartMaxY)

    return (
        <section className="section" id="aqi-history-chart">
            <div className="section-header">
                <div>
                    <h2 className="section-title">
                        <span className="icon">📈</span>
                        AQI Historical Trends — {location}
                        {loading && <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginLeft: 8 }} />}
                    </h2>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                        Visualizing pollutant progression over time from MySQL database
                    </span>
                </div>

                {/* Day, Week, Month Filter Buttons (SRS Module 3 Requirement) */}
                <div className="filter-button-group">
                    <button
                        className={`btn-filter ${range === 'day' ? 'active' : ''}`}
                        onClick={() => onRangeChange('day')}
                    >
                        📅 24 Hours
                    </button>
                    <button
                        className={`btn-filter ${range === 'week' ? 'active' : ''}`}
                        onClick={() => onRangeChange('week')}
                    >
                        🗓️ 7 Days
                    </button>
                    <button
                        className={`btn-filter ${range === 'month' ? 'active' : ''}`}
                        onClick={() => onRangeChange('month')}
                    >
                        📆 30 Days
                    </button>
                </div>
            </div>

            {/* Quick Summary Stats Bar */}
            {sortedData.length > 0 && (
                <div className="chart-stats-bar">
                    <div className="stat-pill">
                        <span className="stat-label">Readings:</span>
                        <span className="stat-val">{sortedData.length}</span>
                    </div>
                    <div className="stat-pill">
                        <span className="stat-label">Minimum AQI:</span>
                        <span className="stat-val">{minAqi}</span>
                    </div>
                    <div className="stat-pill">
                        <span className="stat-label">Maximum AQI:</span>
                        <span className="stat-val text-danger">{maxAqi}</span>
                    </div>
                    <div className="stat-pill">
                        <span className="stat-label">Average AQI:</span>
                        <span className="stat-val">{avgAqi}</span>
                    </div>
                </div>
            )}

            {/* Loading / Empty States */}
            {loading && sortedData.length === 0 && (
                <div className="state-box">
                    <div className="spinner" />
                    <span>Loading historical AQI readings…</span>
                </div>
            )}

            {!loading && sortedData.length === 0 && (
                <div className="state-box">
                    <span style={{ fontSize: '1.8rem' }}>📭</span>
                    <span>No historical readings found for <strong>{location}</strong> in the selected timeframe ({range}).</span>
                    <span className="text-muted">Submit readings using the test form below.</span>
                </div>
            )}

            {/* SVG Interactive Chart */}
            {sortedData.length > 0 && (
                <div className="chart-container" style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} className="aqi-svg-chart" style={{ width: '100%', minWidth: 600, height: 'auto' }}>
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                            </linearGradient>
                        </defs>

                        {/* Background Y-Axis Guide Lines & Level Labels */}
                        {yLevels.map((lvl) => {
                            const yPos = getY(lvl)
                            return (
                                <g key={lvl}>
                                    <line
                                        x1={padding.left}
                                        y1={yPos}
                                        x2={width - padding.right}
                                        y2={yPos}
                                        stroke="#e2e8f0"
                                        strokeDasharray="4 4"
                                    />
                                    <text
                                        x={padding.left - 8}
                                        y={yPos + 4}
                                        textAnchor="end"
                                        fontSize="10"
                                        fill="#94a3b8"
                                    >
                                        {lvl}
                                    </text>
                                </g>
                            )
                        })}

                        {/* Baseline Axis */}
                        <line
                            x1={padding.left}
                            y1={padding.top + plotHeight}
                            x2={width - padding.right}
                            y2={padding.top + plotHeight}
                            stroke="#cbd5e1"
                            strokeWidth="1.5"
                        />

                        {/* Gradient Area Fill */}
                        {areaPath && (
                            <path d={areaPath} fill="url(#chartGradient)" />
                        )}

                        {/* Primary Trend Line */}
                        {pointsString && (
                            <polyline
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                points={pointsString}
                            />
                        )}

                        {/* Interactive Data Points */}
                        {sortedData.map((d, i) => {
                            const cx = getX(i, sortedData.length)
                            const cy = getY(d.aqi)
                            const isHovered = hoveredPoint && hoveredPoint.id === d.id

                            const dotColor =
                                d.aqi <= 50 ? '#16a34a' :
                                d.aqi <= 100 ? '#d97706' :
                                d.aqi <= 150 ? '#ea580c' :
                                d.aqi <= 200 ? '#dc2626' : '#9333ea'

                            return (
                                <g key={d.id || i}>
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r={isHovered ? 6 : 3.5}
                                        fill={dotColor}
                                        stroke="#ffffff"
                                        strokeWidth={isHovered ? 2.5 : 1.5}
                                        style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                                        onMouseEnter={() => setHoveredPoint(d)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                    {/* X-axis time label (show subset to prevent crowding) */}
                                    {(i === 0 || i === sortedData.length - 1 || i % Math.max(1, Math.floor(sortedData.length / 5)) === 0) && (
                                        <text
                                            x={cx}
                                            y={padding.top + plotHeight + 20}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="#64748b"
                                        >
                                            {formatDate(d.recorded_at, range)}
                                        </text>
                                    )}
                                </g>
                            )
                        })}
                    </svg>

                    {/* Tooltip Overlay */}
                    {hoveredPoint && (
                        <div className="chart-tooltip">
                            <div><strong>{formatDate(hoveredPoint.recorded_at, 'week')}</strong></div>
                            <div>AQI: <strong style={{ color: '#2563eb' }}>{hoveredPoint.aqi}</strong> ({hoveredPoint.severity || '—'})</div>
                            {hoveredPoint.pm25 !== undefined && <div>PM2.5: {parseFloat(hoveredPoint.pm25).toFixed(1)} µg/m³</div>}
                            {hoveredPoint.pm10 !== undefined && <div>PM10: {parseFloat(hoveredPoint.pm10).toFixed(1)} µg/m³</div>}
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}
