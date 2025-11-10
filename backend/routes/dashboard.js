const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Lead, Activity, User } = require('../models');
const { authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const whereClause = {};

        // Role-based filtering
        if (req.user.role === 'Sales Executive') {
            whereClause.assignedToId = req.user.id;
        }

        // Total leads
        const totalLeads = await Lead.count({ where: whereClause });

        // Leads by status
        const leadsByStatus = await Lead.findAll({
            where: whereClause,
            attributes: [
                [Sequelize.col('Lead.status'), 'status'],
                [Sequelize.fn('COUNT', Sequelize.col('Lead.id')), 'count']
            ],
            group: ['Lead.status'],
            raw: true
        });

        // Leads by source
        const leadsBySource = await Lead.findAll({
            where: {
                ...whereClause,
                source: {
                    [Op.ne]: null
                }
            },
            attributes: [
                [Sequelize.col('Lead.source'), 'source'],
                [Sequelize.fn('COUNT', Sequelize.col('Lead.id')), 'count']
            ],
            group: ['Lead.source'],
            raw: true
        });

        // Total estimated value
        const totalValue = await Lead.sum('estimatedValue', { where: whereClause }) || 0;

        // Recent activities count (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivities = await Activity.count({
            where: {
                createdAt: {
                    [Op.gte]: sevenDaysAgo
                }
            },
            include: [{
                model: Lead,
                as: 'lead',
                where: whereClause,
                required: true
            }]
        });

        // Activities by type
        // First get lead IDs that match the where clause
        const matchingLeads = await Lead.findAll({
            where: whereClause,
            attributes: ['id'],
            raw: true
        });
        const leadIds = matchingLeads.map(lead => lead.id);

        let activitiesByType = [];
        if (leadIds.length > 0) {
            activitiesByType = await Activity.findAll({
                where: {
                    leadId: {
                        [Op.in]: leadIds
                    }
                },
                attributes: [
                    [Sequelize.col('Activity.type'), 'type'],
                    [Sequelize.fn('COUNT', Sequelize.col('Activity.id')), 'count']
                ],
                group: ['Activity.type'],
                raw: true
            });
        }

        // Leads created in last 30 days (for trend)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const leadsLast30Days = await Lead.count({
            where: {
                ...whereClause,
                createdAt: {
                    [Op.gte]: thirtyDaysAgo
                }
            }
        });

        res.json({
            stats: {
                totalLeads,
                totalValue: parseFloat(totalValue),
                recentActivities,
                leadsLast30Days,
                leadsByStatus: leadsByStatus.map(item => ({
                    status: item.status,
                    count: parseInt(item.count)
                })),
                leadsBySource: leadsBySource.map(item => ({
                    source: item.source,
                    count: parseInt(item.count)
                })),
                activitiesByType: activitiesByType.map(item => ({
                    type: item.type,
                    count: parseInt(item.count)
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
});

// Get performance metrics (Admin/Manager only)
router.get('/performance', authorizeRoles('Admin', 'Manager'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const whereClause = {};

        if (startDate && endDate) {
            whereClause.createdAt = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Performance by user
        const performanceByUser = await Lead.findAll({
            where: whereClause,
            attributes: [
                'assignedToId',
                [Sequelize.fn('COUNT', Sequelize.col('Lead.id')), 'totalLeads'],
                [Sequelize.fn('SUM', Sequelize.col('estimatedValue')), 'totalValue'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN status = 'Won' THEN 1 END")), 'wonLeads']
            ],
            include: [{
                model: User,
                as: 'assignedTo',
                attributes: ['id', 'name', 'email']
            }],
            group: ['assignedToId', 'assignedTo.id', 'assignedTo.name', 'assignedTo.email'],
            having: Sequelize.where(Sequelize.col('assignedToId'), { [Op.ne]: null })
        });

        res.json({
            performance: performanceByUser.map(item => ({
                user: item.assignedTo,
                totalLeads: parseInt(item.dataValues.totalLeads),
                totalValue: parseFloat(item.dataValues.totalValue || 0),
                wonLeads: parseInt(item.dataValues.wonLeads || 0),
                conversionRate: item.dataValues.totalLeads > 0
                    ? ((item.dataValues.wonLeads / item.dataValues.totalLeads) * 100).toFixed(2)
                    : 0
            }))
        });
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        res.status(500).json({ message: 'Error fetching performance metrics', error: error.message });
    }
});

module.exports = router;

