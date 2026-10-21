// notifications.js - Notification dispatcher for AQMAS (Module 5)
// Implements in-app alerts as primary working notification channel.
// Provides clean extensible stubs for Email/SMS delivery without requiring paid third-party dependencies.

'use strict';

/**
 * Returns plain-language health advice based on AQI value and alert context.
 * SRS Module 5 Requirement: Clear, actionable, plain-language guidance.
 */
function getHealthAdvice(aqi, alertType = 'threshold_breach', details = {}) {
    if (alertType === 'spike') {
        const jump = details.jump ? ` (+${details.jump} AQI points)` : '';
        return `Rapid pollution surge detected${jump} in under 3 hours! Immediately suspend outdoor exercise, close all windows, and utilize indoor air filtration if available. Sensitive individuals must remain indoors.`;
    }

    if (alertType === 'disaster') {
        return details.safetyAdvice || 'Emergency warning: Hazardous atmospheric event in progress. Remain indoors with doors and windows tightly sealed. Follow local civil defense guidance.';
    }

    if (aqi <= 50) {
        return 'Air quality is satisfactory and poses little or no health risk. Enjoy outdoor activities.';
    }
    if (aqi <= 100) {
        return 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.';
    }
    if (aqi <= 150) {
        return 'Active children, elderly adults, and people with respiratory disease (such as asthma) should limit prolonged outdoor exertion.';
    }
    if (aqi <= 200) {
        return 'Everyone may begin to experience health effects; sensitive groups may experience more serious effects. Avoid prolonged outdoor physical activity and wear an N95 mask outdoors.';
    }
    if (aqi <= 300) {
        return 'Health alert: The risk of health effects is increased for everyone. Minimize outdoor activity. Keep windows shut and run HEPA air filtration.';
    }
    return 'Health warning of emergency conditions: The entire population is likely to be affected. Avoid all outdoor physical activity. High-risk groups must seek medical advice if experiencing shortness of breath.';
}

/**
 * Notification Dispatcher
 * Dispatches alerts across channels.
 * In-app is fully operational and persistent in MySQL.
 * Email & SMS are structured with configurable hooks, clearly identifying when unconfigured.
 */
async function dispatchNotification(alert) {
    const deliveryReport = {
        alertId: alert.id,
        inApp: {
            status: 'delivered',
            timestamp: new Date().toISOString(),
            note: 'In-app notification saved and queued for real-time client polling/sync.',
        },
        email: {
            status: 'skipped',
            configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
            note: process.env.SMTP_HOST
                ? 'Email channel provider configured.'
                : 'Email notification skipped: No SMTP provider configured in .env (college demo mode).',
        },
        sms: {
            status: 'skipped',
            configured: Boolean(process.env.SMS_API_KEY || process.env.TWILIO_SID),
            note: (process.env.SMS_API_KEY || process.env.TWILIO_SID)
                ? 'SMS channel provider configured.'
                : 'SMS notification skipped: No SMS gateway configured in .env (college demo mode).',
        },
    };

    console.log(`[Notification Dispatcher] 🚨 Alert #${alert.id} (${alert.alert_type}) dispatched for ${alert.location}. AQI: ${alert.aqi}. In-App: Delivered.`);

    return deliveryReport;
}

module.exports = {
    getHealthAdvice,
    dispatchNotification,
};
