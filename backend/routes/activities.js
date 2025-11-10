const express = require('express');
const { body, validationResult } = require('express-validator');
const { Activity, Lead, User } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { emitNotification } = require('../socket/socketHandler');
const { sendEmailNotification } = require('../utils/emailService');
const { sendToSlack } = require('./integrations');

const router = express.Router();

// Get all activities for a lead
router.get('/lead/:leadId', async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.leadId);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Check access permission
        if (req.user.role === 'Sales Executive' && lead.assignedToId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const activities = await Activity.findAll({
            where: { leadId: req.params.leadId },
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json({ activities });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Error fetching activities', error: error.message });
    }
});

// Create new activity
router.post('/',
    [
        body('type').isIn(['Note', 'Call', 'Meeting', 'Email', 'Status Change']).withMessage('Invalid activity type'),
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('leadId').isUUID().withMessage('Valid lead ID is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const lead = await Lead.findByPk(req.body.leadId, {
                include: [{ model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }]
            });

            if (!lead) {
                return res.status(404).json({ message: 'Lead not found' });
            }

            // Check access permission
            if (req.user.role === 'Sales Executive' && lead.assignedToId !== req.user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const activity = await Activity.create({
                ...req.body,
                userId: req.user.id
            });

            const activityWithUser = await Activity.findByPk(activity.id, {
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
            });

            // Emit real-time notification
            emitNotification('activity_created', {
                activity: activityWithUser,
                lead: lead,
                createdBy: req.user.name
            }, lead.assignedToId);

            // Send email notification if activity is important
            if (['Call', 'Meeting', 'Status Change'].includes(req.body.type)) {
                try {
                    await sendEmailNotification({
                        to: lead.assignedTo?.email,
                        subject: `New ${req.body.type} on Lead: ${lead.name}`,
                        text: `${req.user.name} added a ${req.body.type.toLowerCase()}: ${req.body.title}`
                    });
                } catch (emailError) {
                    console.error('Email notification error:', emailError);
                    // Don't fail the request if email fails
                }
            }

            // Send to third-party integrations
            await sendToSlack('activity_created', {
                activity: activityWithUser,
                lead: lead,
                createdBy: req.user.name
            });

            res.status(201).json({ message: 'Activity created successfully', activity: activityWithUser });
        } catch (error) {
            console.error('Error creating activity:', error);
            res.status(500).json({ message: 'Error creating activity', error: error.message });
        }
    }
);

// Update activity
router.put('/:id',
    [
        body('title').optional().trim().notEmpty(),
        body('description').optional()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const activity = await Activity.findByPk(req.params.id, {
                include: [{ model: Lead, as: 'lead' }]
            });

            if (!activity) {
                return res.status(404).json({ message: 'Activity not found' });
            }

            // Check access permission
            if (req.user.role === 'Sales Executive' && activity.lead.assignedToId !== req.user.id) {
                return res.status(403).json({ message: 'Access denied' });
            }

            // Only allow creator or Admin/Manager to update
            if (activity.userId !== req.user.id && !['Admin', 'Manager'].includes(req.user.role)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            await activity.update(req.body);
            await activity.reload();

            const updatedActivity = await Activity.findByPk(activity.id, {
                include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
            });

            res.json({ message: 'Activity updated successfully', activity: updatedActivity });
        } catch (error) {
            console.error('Error updating activity:', error);
            res.status(500).json({ message: 'Error updating activity', error: error.message });
        }
    }
);

// Delete activity (Admin/Manager only, or creator)
router.delete('/:id', async (req, res) => {
    try {
        const activity = await Activity.findByPk(req.params.id);
        if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        // Only allow creator or Admin/Manager to delete
        if (activity.userId !== req.user.id && !['Admin', 'Manager'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await activity.destroy();
        res.json({ message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ message: 'Error deleting activity', error: error.message });
    }
});

module.exports = router;

