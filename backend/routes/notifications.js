const express = require('express');
const { Activity, Lead } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get recent notifications for current user
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        // Get recent activities on leads assigned to user
        const userLeads = await Lead.findAll({
            where: { assignedToId: req.user.id },
            attributes: ['id']
        });
        const leadIds = userLeads.map(lead => lead.id);

        if (leadIds.length === 0) {
            return res.json({ notifications: [] });
        }

        const recentActivities = await Activity.findAll({
            where: {
                leadId: { [require('sequelize').Op.in]: leadIds }
            },
            include: [{
                model: Lead,
                as: 'lead',
                attributes: ['id', 'name']
            }],
            order: [['createdAt', 'DESC']],
            limit: 20
        });

        const notifications = recentActivities.map(activity => ({
            id: activity.id,
            type: activity.type,
            message: `${activity.type} on lead "${activity.lead.name}"`,
            timestamp: activity.createdAt,
            leadId: activity.leadId
        }));

        res.json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

module.exports = router;

