// App.jsx — Main Application Root for AQMAS (Modules 3 & 5)
// Integrates Dashboard, Historical Visualization, Multi-Location Comparison,
// Threshold Configuration, Alert Management, and Demonstration Telemetry.

import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header.jsx'
import AQISummary from './components/AQISummary.jsx'
import AQIChart from './components/AQIChart.jsx'
import LocationComparison from './components/LocationComparison.jsx'
import HistoryTable from './components/HistoryTable.jsx'
import ThresholdConfig from './components/ThresholdConfig.jsx'
import AlertsSection from './components/AlertsSection.jsx'
import TestReading from './components/TestReading.jsx'

// Backend base URL — empty string uses Vite proxy
const API = ''

const DEFAULT_LOCATIONS = ['Mumbai', 'Delhi', 'Pune', 'Bangalore']
const AUTO_REFRESH_MS = 15000

export default function App() {
    const [locations, setLocations] = useState(DEFAULT_LOCATIONS)
    const [selectedLocation, setSelectedLocation] = useState('Mumbai')
    const [backendStatus, setBackendStatus] = useState('checking')
    const [lastRefreshed, setLastRefreshed] = useState(null)

    // Module 3: Time Range Filter (day | week | month)
    const [historyRange, setHistoryRange] = useState('week')

    // Dashboard & Alert State
    const [latestReading, setLatestReading] = useState(null)
    const [history, setHistory] = useState([])
    const [alerts, setAlerts] = useState([])
    const [loadingDash, setLoadingDash] = useState(false)
    const [loadingAlerts, setLoadingAlerts] = useState(false)

    // Key to trigger comparison component re-fetch when new reading submitted
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    // Health check
    const checkHealth = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/health`)
            setBackendStatus(res.ok ? 'online' : 'offline')
        } catch {
            setBackendStatus('offline')
        }
    }, [])

    // Fetch dashboard data
    const fetchDashboard = useCallback(async () => {
        if (!selectedLocation) return
        setLoadingDash(true)
        try {
            const [latestRes, historyRes] = await Promise.all([
                fetch(`${API}/api/air-quality?location=${encodeURIComponent(selectedLocation)}`),
                fetch(`${API}/api/air-quality/history?location=${encodeURIComponent(selectedLocation)}&range=${historyRange}`),
            ])

            if (latestRes.ok) {
                setLatestReading(await latestRes.json())
            } else if (latestRes.status === 404) {
                setLatestReading(null)
            }

            if (historyRes.ok) {
                setHistory(await historyRes.json())
            }
            setLastRefreshed(new Date())
        } catch {
            // Keep existing data visible on temporary network disconnect
        } finally {
            setLoadingDash(false)
        }
    }, [selectedLocation, historyRange])

    // Fetch alerts
    const fetchAlerts = useCallback(async () => {
        if (!selectedLocation) return
        setLoadingAlerts(true)
        try {
            const res = await fetch(`${API}/api/alerts?location=${encodeURIComponent(selectedLocation)}`)
            if (res.ok) {
                setAlerts(await res.json())
            }
        } catch {
            // silent fail
        } finally {
            setLoadingAlerts(false)
        }
    }, [selectedLocation])

    // Fetch known locations
    const fetchLocations = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/locations`)
            if (res.ok) {
                const locs = await res.json()
                if (Array.isArray(locs) && locs.length > 0) setLocations(locs)
            }
        } catch {
            // fallback
        }
    }, [])

    // Initial load
    useEffect(() => {
        checkHealth()
        fetchLocations()
    }, [checkHealth, fetchLocations])

    // On location or range change
    useEffect(() => {
        fetchDashboard()
        fetchAlerts()
    }, [fetchDashboard, fetchAlerts])

    // Auto-refresh timer
    useEffect(() => {
        const timer = setInterval(() => {
            fetchDashboard()
            fetchAlerts()
        }, AUTO_REFRESH_MS)
        return () => clearInterval(timer)
    }, [fetchDashboard, fetchAlerts])

    // Telemetry submission callback
    const handleNewReading = () => {
        fetchDashboard()
        fetchAlerts()
        setRefreshTrigger((prev) => prev + 1)
    }

    // Alert acknowledgement callback
    const handleAlertAcknowledged = (updatedAlert) => {
        setAlerts((prev) =>
            prev.map((a) => (a.id === updatedAlert.id ? updatedAlert : a))
        )
    }

    const handleManualRefresh = () => {
        checkHealth()
        fetchDashboard()
        fetchAlerts()
        setRefreshTrigger((prev) => prev + 1)
    }

    const activeAlertCount = alerts.filter((a) => a.status === 'active').length

    return (
        <>
            <Header
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                onRefresh={handleManualRefresh}
                backendStatus={backendStatus}
                activeAlertCount={activeAlertCount}
            />

            <main className="app page-top">
                {/* Auto-refresh & live sync bar */}
                <div className="refresh-bar">
                    <span className="dot-active" />
                    <span className="text-muted">
                        Live monitoring polling every {AUTO_REFRESH_MS / 1000}s
                        {lastRefreshed && ` — Synced with MySQL at: ${lastRefreshed.toLocaleTimeString()}`}
                    </span>
                </div>

                {/* MODULE 3: Current AQI Dashboard & Monitored Pollutants */}
                <AQISummary
                    reading={latestReading}
                    loading={loadingDash}
                    location={selectedLocation}
                />

                {/* MODULE 3: Historical AQI Trends Chart (Day, Week, Month filters) */}
                <AQIChart
                    history={history}
                    loading={loadingDash}
                    location={selectedLocation}
                    range={historyRange}
                    onRangeChange={setHistoryRange}
                />

                {/* MODULE 3: Location Selection, Comparison (up to 3), and Station Map */}
                <LocationComparison
                    key={refreshTrigger}
                    locations={locations}
                    primaryLocation={selectedLocation}
                    onSelectPrimary={setSelectedLocation}
                    apiBase={API}
                />

                {/* MODULE 3: Tabular Historical Readings Log */}
                <HistoryTable
                    history={history}
                    loading={loadingDash}
                    location={selectedLocation}
                    range={historyRange}
                    onRangeChange={setHistoryRange}
                />

                {/* MODULE 5: Single-User Threshold Configuration */}
                <ThresholdConfig
                    locations={locations}
                    selectedLocation={selectedLocation}
                    apiBase={API}
                    onThresholdUpdated={fetchAlerts}
                />

                {/* MODULE 5: Alert Feed, Plain-Language Health Advice, Cooldown, and Acknowledgement */}
                <AlertsSection
                    alerts={alerts}
                    loading={loadingAlerts}
                    location={selectedLocation}
                    apiBase={API}
                    onAcknowledged={handleAlertAcknowledged}
                />

                {/* MODULE 5: Simulation Telemetry Console & Quick Viva Presets */}
                <TestReading
                    locations={locations}
                    selectedLocation={selectedLocation}
                    apiBase={API}
                    onSubmitSuccess={handleNewReading}
                />
            </main>
        </>
    )
}
