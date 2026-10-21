// Header component — site title, status indicator, active alert badge, location selector, refresh button

import React from 'react'

export default function Header({ locations, selectedLocation, onLocationChange, onRefresh, backendStatus, activeAlertCount = 0 }) {
    const statusLabel = {
        online: 'Backend Online',
        offline: 'Backend Offline',
        checking: 'Checking…',
    }[backendStatus] || 'Checking…'

    return (
        <header className="header">
            <div className="header-inner">
                <div className="header-brand">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: '1.8rem' }}>🌬️</span>
                        <div>
                            <h1>AQMAS</h1>
                            <p>Air Quality Monitoring & Alert System</p>
                        </div>
                    </div>
                </div>

                <div className="header-controls">
                    {/* Active Alert Notification Badge */}
                    {activeAlertCount > 0 && (
                        <a href="#alerts-section" className="header-alert-pill" title="Jump to active alerts">
                            🚨 {activeAlertCount} Active Alert{activeAlertCount > 1 ? 's' : ''}
                        </a>
                    )}

                    {/* Backend connectivity indicator */}
                    <div className="status-indicator">
                        <span className={`status-dot ${backendStatus}`} />
                        <span>{statusLabel}</span>
                    </div>

                    {/* Location selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label htmlFor="header-location" style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            📍 City:
                        </label>
                        <select
                            id="header-location"
                            value={selectedLocation}
                            onChange={(e) => onLocationChange(e.target.value)}
                            style={{ width: 'auto', minWidth: '130px' }}
                        >
                            {locations.map((loc) => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>

                    {/* Manual refresh button */}
                    <button className="btn btn-secondary" id="btn-refresh" onClick={onRefresh}>
                        🔄 Refresh
                    </button>
                </div>
            </div>
        </header>
    )
}
