import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header.jsx'
import AQISummary from './components/AQISummary.jsx'
import HistoryTable from './components/HistoryTable.jsx'
import ThresholdConfig from './components/ThresholdConfig.jsx'
import AlertsSection from './components/AlertsSection.jsx'
import TestReading from './components/TestReading.jsx'

// Backend base URL — empty string uses the Vite proxy defined in vite.config.js
const API = ''

// Known locations (also fetched from backend on mount)
const DEFAULT_LOCATIONS = ['Mumbai', 'Delhi', 'Pune', 'Bangalore']

// How often (ms) to auto-refresh dashboard data
const AUTO_REFRESH_MS = 15000

export default function App() {
    const [locations, setLocations] = useState(DEFAULT_LOCATIONS)
    const [selectedLocation, setSelectedLocation] = useState('Mumbai')
    const [backendStatus, setBackendStatus] = useState('checking') // 'online'|'offline'|'checking'
    const [lastRefreshed, setLastRefreshed] = useState(null)

    // Lifted state so dashboard and alerts refresh on new reading submission
    const [latestReading, setLatestReading] = useState(null)
    const [history, setHistory] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loadingDash, setLoadingDash] = useState(false)
    const [loadingAlerts, setLoadingAlerts] = useState(false)

    // ---- Health check ----
    const checkHealth = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/health`)
            setBackendStatus(res.ok ? 'online' : 'offline')
        } catch {
            setBackendStatus('offline')
        }
    }, [])

    // ---- Fetch dashboard data ----
    const fetchDashboard = useCallback(async () => {
        if (!selectedLocation) return
        setLoadingDash(true)
        try {
            const [latestRes, historyRes] = await Promise.all([
                fetch(`${API}/api/air-quality?location=${encodeURIComponent(selectedLocation)}`),
                fetch(`${API}/api/air-quality/history?location=${encodeURIComponent(selectedLocation)}`),
            ])
            if (latestRes.ok) {
                setLatestReading(await latestRes.json())
            } else if (latestRes.status === 404) {
                setLatestReading(null)
            }
            if (historyRes.ok) setHistory(await historyRes.json())
            setLastRefreshed(new Date())
        } catch {
            // leave existing data visible, just note offline
        } finally {
            setLoadingDash(false)
        }
    }, [selectedLocation])

    // ---- Fetch alerts ----
    const fetchAlerts = useCallback(async () => {
        if (!selectedLocation) return
        setLoadingAlerts(true)
        try {
            const res = await fetch(`${API}/api/alerts?location=${encodeURIComponent(selectedLocation)}`)
            if (res.ok) setAlerts(await res.json())
        } catch {
            // silent fail — network issues
        } finally {
            setLoadingAlerts(false)
        }
    }, [selectedLocation])

    // ---- Fetch known locations from backend ----
    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/locations`)
            if (res.ok) {
                const locs = await res.json()
                if (Array.isArray(locs) && locs.length > 0) setLocations(locs)
            }
        } catch { /* fallback to DEFAULT_LOCATIONS */ }
    }, [])

    // ---- Initial load ----
    useEffect(() => {
        checkHealth()
        fetchLocations()
    }, [checkHealth, fetchLocations])

    // ---- On location change: refetch everything ----
    useEffect(() => {
        fetchDashboard()
        fetchAlerts()
    }, [fetchDashboard, fetchAlerts])

    // ---- Auto-refresh every 15 seconds ----
    useEffect(() => {
        const timer = setInterval(() => {
            fetchDashboard()
            fetchAlerts()
        }, AUTO_REFRESH_MS)
        return () => clearInterval(timer)
    }, [fetchDashboard, fetchAlerts])

    // Called after test reading submitted — refresh all
    const handleNewReading = () => {
        fetchDashboard()
        fetchAlerts()
    }

    // Called after acknowledging an alert
    const handleAlertAcknowledged = (updatedAlert) => {
        setAlerts((prev) =>
            prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
        )
    }

    const handleManualRefresh = () => {
        checkHealth()
        fetchDashboard()
        fetchAlerts()
    }

    return (
        <>
            <Header
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                onRefresh={handleManualRefresh}
                backendStatus={backendStatus}
            />

            <div className="app page-top">
                {/* Auto-refresh indicator */}
                <div className="refresh-bar">
                    <span className="dot-active" />
                    <span className="text-muted">
                        Auto-refreshes every {AUTO_REFRESH_MS / 1000}s
                        {lastRefreshed && ` — Last updated: ${lastRefreshed.toLocaleTimeString()}`}
                    </span>
                </div>

                {/* Module 1: Dashboard */}
                <AQISummary reading={latestReading} loading={loadingDash} location={selectedLocation} />
                <HistoryTable history={history} loading={loadingDash} location={selectedLocation} />

                {/* Module 2: Alert System */}
                <ThresholdConfig
                    locations={locations}
                    selectedLocation={selectedLocation}
                    apiBase={API}
                />
                <AlertsSection
                    alerts={alerts}
                    loading={loadingAlerts}
                    location={selectedLocation}
                    apiBase={API}
                    onAcknowledged={handleAlertAcknowledged}
                />
                <TestReading
                    locations={locations}
                    apiBase={API}
                    onSubmitSuccess={handleNewReading}
                />
            </div>
        </>
    )
}
