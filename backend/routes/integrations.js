const express = require('express');
const axios = require('axios');
const { Lead, Activity } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Webhook configuration storage (in production, use database)
const webhookConfigs = {
    hubspot: null,
    slack: null
};

// Configure HubSpot webhook
router.post('/webhooks/hubspot',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    async (req, res) => {
        try {
            const { apiKey, enabled } = req.body;

            if (enabled && !apiKey) {
                return res.status(400).json({ message: 'HubSpot API key is required' });
            }

            webhookConfigs.hubspot = enabled ? { apiKey, enabled: true } : null;

            res.json({
                message: enabled ? 'HubSpot webhook configured' : 'HubSpot webhook disabled',
                configured: enabled
            });
        } catch (error) {
            console.error('Error configuring HubSpot webhook:', error);
            res.status(500).json({ message: 'Error configuring webhook', error: error.message });
        }
    }
);

// Configure Slack webhook
router.post('/webhooks/slack',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    async (req, res) => {
        try {
            const { webhookUrl, enabled } = req.body;

            if (enabled && !webhookUrl) {
                return res.status(400).json({ message: 'Slack webhook URL is required' });
            }

            webhookConfigs.slack = enabled ? { webhookUrl, enabled: true } : null;

            res.json({
                message: enabled ? 'Slack webhook configured' : 'Slack webhook disabled',
                configured: enabled
            });
        } catch (error) {
            console.error('Error configuring Slack webhook:', error);
            res.status(500).json({ message: 'Error configuring webhook', error: error.message });
        }
    }
);

// Get webhook configurations
router.get('/webhooks',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    async (req, res) => {
        try {
            res.json({
                hubspot: webhookConfigs.hubspot ? { enabled: true } : { enabled: false },
                slack: webhookConfigs.slack ? { enabled: true } : { enabled: false }
            });
        } catch (error) {
            res.status(500).json({ message: 'Error fetching webhook configs', error: error.message });
        }
    }
);

// Test webhook (for testing integrations)
router.post('/webhooks/test',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    async (req, res) => {
        try {
            const { type } = req.body; // 'hubspot' or 'slack'

            if (type === 'hubspot' && webhookConfigs.hubspot?.enabled) {
                // Test HubSpot connection
                try {
                    await axios.get('https://api.hubapi.com/crm/v3/objects/contacts', {
                        headers: {
                            'Authorization': `Bearer ${webhookConfigs.hubspot.apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        params: { limit: 1 }
                    });
                    res.json({ message: 'HubSpot connection successful', success: true });
                } catch (error) {
                    res.status(400).json({
                        message: 'HubSpot connection failed',
                        error: error.response?.data?.message || error.message,
                        success: false
                    });
                }
            } else if (type === 'slack' && webhookConfigs.slack?.enabled) {
                // Test Slack webhook
                try {
                    await axios.post(webhookConfigs.slack.webhookUrl, {
                        text: '🧪 Test notification from CRM System',
                        attachments: [{
                            color: 'good',
                            fields: [{ title: 'Status', value: 'Integration test successful', short: false }]
                        }]
                    });
                    res.json({ message: 'Slack webhook test successful', success: true });
                } catch (error) {
                    res.status(400).json({
                        message: 'Slack webhook test failed',
                        error: error.message,
                        success: false
                    });
                }
            } else {
                res.status(400).json({
                    message: `${type} integration is not enabled or configured`,
                    success: false
                });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error testing webhook', error: error.message });
        }
    }
);

// Helper function to send to HubSpot
const sendToHubSpot = async (event, data) => {
    if (!webhookConfigs.hubspot?.enabled) return;

    try {
        // Example: Create contact in HubSpot
        if (event === 'lead_created') {
            const nameParts = data.lead.name.split(' ');
            await axios.post(
                'https://api.hubapi.com/crm/v3/objects/contacts',
                {
                    properties: {
                        email: data.lead.email,
                        firstname: nameParts[0] || '',
                        lastname: nameParts.slice(1).join(' ') || '',
                        phone: data.lead.phone || '',
                        company: data.lead.company || '',
                        hs_lead_status: data.lead.status
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${webhookConfigs.hubspot.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Lead synced to HubSpot');
        }
    } catch (error) {
        console.error('HubSpot webhook error:', error.response?.data || error.message);
    }
};

// Helper function to send to Slack
const sendToSlack = async (event, data) => {
    if (!webhookConfigs.slack?.enabled) return;

    try {
        let message = '';
        let color = 'good';

        switch (event) {
            case 'lead_created':
                message = {
                    text: `🎯 New Lead Created`,
                    attachments: [{
                        color: color,
                        fields: [
                            { title: 'Lead Name', value: data.lead.name, short: true },
                            { title: 'Email', value: data.lead.email, short: true },
                            { title: 'Status', value: data.lead.status, short: true },
                            { title: 'Assigned To', value: data.lead.assignedTo?.name || 'Unassigned', short: true }
                        ]
                    }]
                };
                break;
            case 'lead_assigned':
                message = {
                    text: `👤 Lead Assigned`,
                    attachments: [{
                        color: color,
                        fields: [
                            { title: 'Lead Name', value: data.lead.name, short: true },
                            { title: 'Assigned To', value: data.lead.assignedTo?.name, short: true },
                            { title: 'Assigned By', value: data.assignedBy, short: true }
                        ]
                    }]
                };
                break;
            case 'activity_created':
                if (['Call', 'Meeting', 'Status Change'].includes(data.activity.type)) {
                    message = {
                        text: `📞 New ${data.activity.type} on Lead`,
                        attachments: [{
                            color: color,
                            fields: [
                                { title: 'Lead', value: data.lead.name, short: true },
                                { title: 'Activity Type', value: data.activity.type, short: true },
                                { title: 'Title', value: data.activity.title, short: false }
                            ]
                        }]
                    };
                }
                break;
        }

        if (message) {
            await axios.post(webhookConfigs.slack.webhookUrl, message);
            console.log('Notification sent to Slack');
        }
    } catch (error) {
        console.error('Slack webhook error:', error.response?.data || error.message);
    }
};

// Export webhook functions for use in other routes
module.exports = {
    router,
    sendToHubSpot,
    sendToSlack
};

