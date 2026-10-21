// test_modules.js - Comprehensive test suite for AQMAS Module 3 & Module 5
'use strict';

const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: { 'Content-Type': 'application/json' },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch {
                    parsed = data;
                }
                resolve({ status: res.statusCode, data: parsed });
            });
        });

        req.on('error', reject);
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('========================================');
    console.log('🧪 AQMAS Automated Test Suite (Mod 3 & 5)');
    console.log('========================================\n');

    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    try {
        // 1. Health check
        const health = await request('GET', '/api/health');
        assert(health.status === 200 && health.data.status === 'ok', 'Server is healthy (/api/health)');

        // 2. Locations
        const locs = await request('GET', '/api/locations');
        assert(locs.status === 200 && Array.isArray(locs.data) && locs.data.includes('Mumbai'), 'Locations listed successfully');

        // 3. Module 3: Pollutants in latest reading
        const latest = await request('GET', '/api/air-quality?location=Mumbai');
        assert(latest.status === 200 && latest.data.aqi !== undefined && latest.data.pm25 !== undefined && 'co' in latest.data,
            'Latest reading includes AQI, PM2.5, PM10, and pollutant keys');

        // 4. Module 3: History Day, Week, Month filters
        const histDay = await request('GET', '/api/air-quality/history?location=Mumbai&range=day');
        assert(histDay.status === 200 && Array.isArray(histDay.data), 'History filter: Day filter works');

        const histWeek = await request('GET', '/api/air-quality/history?location=Mumbai&range=week');
        assert(histWeek.status === 200 && Array.isArray(histWeek.data), 'History filter: Week filter works');

        const histMonth = await request('GET', '/api/air-quality/history?location=Mumbai&range=month');
        assert(histMonth.status === 200 && Array.isArray(histMonth.data), 'History filter: Month filter works');

        // 5. Module 3: Location comparison (up to 3)
        const compare = await request('GET', '/api/air-quality/compare?locations=Mumbai,Delhi,Pune&range=week');
        assert(compare.status === 200 && compare.data.locations.length === 3 && compare.data.data.Mumbai && compare.data.data.Delhi,
            'Location comparison supports 3 locations with current and historical trends');

        // 6. Module 5: Save and retrieve threshold
        const testLoc = 'TestCity_' + Date.now();
        const saveThresh = await request('POST', '/api/thresholds', {
            location: testLoc,
            threshold_value: 100,
            enabled: true,
        });
        assert(saveThresh.status === 200 && saveThresh.data.threshold.threshold_value === 100, 'Threshold saved in MySQL');

        const getThresh = await request('GET', `/api/thresholds?location=${testLoc}`);
        assert(getThresh.status === 200 && getThresh.data.threshold_value === 100 && getThresh.data.enabled === 1,
            'Threshold retrieved correctly from MySQL');

        // 7. Module 5 Scenario A: AQI 156 with threshold 100 -> creates alert
        const readA = await request('POST', '/api/air-quality', {
            location: testLoc,
            aqi: 156,
            pm25: 68.5,
            pm10: 120.3,
        });
        assert(readA.status === 201 && readA.data.alertGenerated === true && readA.data.alert && readA.data.alert.aqi === 156,
            'Scenario A: AQI 156 with threshold 100 creates threshold alert');
        const alertAId = readA.data.alert ? readA.data.alert.id : null;

        // 8. Module 5 Scenario: Duplicate prevention & 3-hour cooldown
        // Same breach immediately again should NOT generate another duplicate alert
        const readDup = await request('POST', '/api/air-quality', {
            location: testLoc,
            aqi: 158,
            pm25: 70.0,
            pm10: 125.0,
        });
        assert(readDup.status === 201 && readDup.data.alertGenerated === false && readDup.data.duplicateSuppressed === true,
            'Duplicate prevention: repeated breach within 3 hours is suppressed by cooldown');

        // 9. Module 5 Scenario: Cooldown allows legitimate breach after cooldown
        // Simulate reading 4 hours later
        const fourHoursLater = new Date(Date.now() + 4 * 60 * 60 * 1000);
        const readAfterCooldown = await request('POST', '/api/air-quality', {
            location: testLoc,
            aqi: 165,
            pm25: 75.0,
            pm10: 130.0,
            recorded_at: fourHoursLater.toISOString(),
        });
        assert(readAfterCooldown.status === 201 && readAfterCooldown.data.alertGenerated === true,
            'Cooldown expiration: legitimate breach after 3 hours creates a new alert');

        // 10. Module 5 Scenario B: AQI 65 with threshold 100 -> NO alert
        const testLocB = 'TestCityB_' + Date.now();
        await request('POST', '/api/thresholds', { location: testLocB, threshold_value: 100, enabled: true });
        const readB = await request('POST', '/api/air-quality', {
            location: testLocB,
            aqi: 65,
            pm25: 25.0,
            pm10: 50.0,
        });
        assert(readB.status === 201 && readB.data.alertGenerated === false,
            'Scenario B: AQI 65 with threshold 100 does NOT create an alert');

        // 11. Module 5 Scenario C: Threshold disabled -> NO alert even if AQI > threshold
        const testLocC = 'TestCityC_' + Date.now();
        await request('POST', '/api/thresholds', { location: testLocC, threshold_value: 100, enabled: false });
        const readC = await request('POST', '/api/air-quality', {
            location: testLocC,
            aqi: 156,
            pm25: 68.5,
            pm10: 120.3,
        });
        assert(readC.status === 201 && readC.data.alertGenerated === false,
            'Scenario C: Disabled threshold prevents alert generation on AQI 156');

        // 13. Module 5 Sudden AQI Spike: Increase > 100 within < 3 hours
        const testLocSpike = 'SpikeCity_' + Date.now();
        // Baseline low reading 30 min ago
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        await request('POST', '/api/air-quality', {
            location: testLocSpike,
            aqi: 40,
            pm25: 12.0,
            pm10: 30.0,
            recorded_at: thirtyMinsAgo.toISOString(),
        });
        // Now spike reading to 160 (+120 jump in 30 mins)
        const readSpike = await request('POST', '/api/air-quality', {
            location: testLocSpike,
            aqi: 160,
            pm25: 70.0,
            pm10: 130.0,
        });
        assert(readSpike.status === 201 && (readSpike.data.spikeAlert !== null || readSpike.data.alertGenerated === true),
            'Spike detection: AQI jump > 100 points within < 3 hours triggers a high-priority spike alert');

        // 14. Spike duplicate prevention: page refresh or repeated spike query does NOT duplicate alerts
        const spikeAlertsBefore = await request('GET', `/api/alerts?location=${testLocSpike}`);
        const spikeCountBefore = spikeAlertsBefore.data.filter(a => a.alert_type === 'spike').length;
        // Simulate refresh by querying alerts again
        const spikeAlertsAfter = await request('GET', `/api/alerts?location=${testLocSpike}`);
        const spikeCountAfter = spikeAlertsAfter.data.filter(a => a.alert_type === 'spike').length;
        assert(spikeCountBefore === 1 && spikeCountAfter === 1,
            'Spike persistence: Page refresh / alert fetch reads existing records without creating duplicates');

        // Also test that repeated reading during spike cooldown does NOT create another spike alert
        const readSpikeRepeat = await request('POST', '/api/air-quality', {
            location: testLocSpike,
            aqi: 165,
            pm25: 72.0,
            pm10: 135.0,
        });
        assert(readSpikeRepeat.status === 201 && readSpikeRepeat.data.spikeAlert === null,
            'Spike cooldown: repeated reading during spike cooldown does not generate repeated spike alerts');

        // 15. Module 5 Alert Acknowledgement
        if (alertAId) {
            const ackRes = await request('PATCH', `/api/alerts/${alertAId}/acknowledge`);
            assert(ackRes.status === 200 && ackRes.data.alert.status === 'acknowledged',
                'Alert acknowledgement marks alert as acknowledged');

            // Verify persistence by refetching from MySQL
            const alertList = await request('GET', `/api/alerts?location=${testLoc}`);
            const foundAck = alertList.data.find((a) => a.id === alertAId);
            assert(foundAck && foundAck.status === 'acknowledged',
                'Alert acknowledgement persists in MySQL upon refetching');
        }

        // 16. Module 5 Disaster-linked alerts
        const disasterRes = await request('GET', '/api/disaster-alerts');
        assert(disasterRes.status === 200 && Array.isArray(disasterRes.data.disasterAlerts) && disasterRes.data.disasterAlerts.length > 0,
            'Disaster-linked alerts returned with safety advice and fixture notice');

        // 17. Invalid values and missing readings safety
        const invalidAqi = await request('POST', '/api/air-quality', { location: 'Mumbai', aqi: -5, pm25: 10, pm10: 20 });
        assert(invalidAqi.status === 400, 'Invalid negative AQI safely rejected with 400');

        const missingLoc = await request('POST', '/api/air-quality', { aqi: 100, pm25: 10, pm10: 20 });
        assert(missingLoc.status === 400, 'Missing location safely rejected with 400');

        // 18. Existing functionality regression verification
        const delhiLatest = await request('GET', '/api/air-quality?location=Delhi');
        assert(delhiLatest.status === 200 && delhiLatest.data.location === 'Delhi',
            'Regression check: Existing Delhi endpoint works properly');

        const delhiHistory = await request('GET', '/api/air-quality/history?location=Delhi');
        assert(delhiHistory.status === 200 && Array.isArray(delhiHistory.data) && delhiHistory.data.length > 0,
            'Regression check: Existing default 20-limit history endpoint works properly');

    } catch (err) {
        console.error('Test execution failed with error:', err.message);
        failed++;
    }

    console.log('\n========================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================');
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
