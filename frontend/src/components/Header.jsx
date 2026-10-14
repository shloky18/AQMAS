// Header component — site title, status indicator, location selector, refresh button

export default function Header({ locations, selectedLocation, onLocationChange, onRefresh, backendStatus }) {
    const statusLabel = {
        online: 'Backend Online',
        offline: 'Backend Offline',
        checking: 'Checking…',
    }[backendStatus] || 'Checking…'

    return (
        <header className="header">
            <div className="header-inner">
                <div className="header-brand">
                    <h1>🌬️ AQMAS</h1>
                    <p>Air Quality Alert Generation System</p>
                </div>

                <div className="header-controls">
                    {/* Backend connectivity indicator */}
                    <div className="status-indicator">
                        <span className={`status-dot ${backendStatus}`} />
                        <span>{statusLabel}</span>
                    </div>

                    {/* Location selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label htmlFor="header-location" style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            📍 Location:
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
