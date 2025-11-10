const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { Lead, User, Activity } = require('../models');
const { authorizeRoles } = require('../middleware/auth');
const { emitNotification } = require('../socket/socketHandler');
const { sendEmailNotification } = require('../utils/emailService');
const { sendToHubSpot, sendToSlack } = require('./integrations');

const router = express.Router();

// Get all leads with filters and pagination
router.get('/',
    [
        query('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
        query('assignedToId').optional().isUUID(),
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { status, assignedToId, page = 1, limit = 10 } = req.query;
            const offset = (page - 1) * limit;

            // Build where clause
            const where = {};
            if (status) where.status = status;

            // Role-based filtering
            if (req.user.role === 'Sales Executive') {
                where.assignedToId = req.user.id;
            } else if (assignedToId) {
                where.assignedToId = assignedToId;
            }

            const { count, rows: leads } = await Lead.findAndCountAll({
                where,
                include: [
                    { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
                    { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
                ],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                leads,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Error fetching leads:', error);
            res.status(500).json({ message: 'Error fetching leads', error: error.message });
        }
    }
);

// Get single lead by ID
router.get('/:id', async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id, {
            include: [
                { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
                {
                    model: Activity,
                    as: 'activities',
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        // Check access permission
        if (req.user.role === 'Sales Executive' && lead.assignedToId !== req.user.id) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json({ lead });
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ message: 'Error fetching lead', error: error.message });
    }
});

// Create new lead
router.post('/',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
        body('assignedToId').optional().isUUID()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const leadData = {
                ...req.body,
                createdById: req.user.id,
                assignedToId: req.body.assignedToId || req.user.id
            };

            const lead = await Lead.create(leadData);

            // Create initial activity
            await Activity.create({
                type: 'Note',
                title: 'Lead Created',
                description: `Lead "${lead.name}" was created`,
                leadId: lead.id,
                userId: req.user.id
            });

            const leadWithRelations = await Lead.findByPk(lead.id, {
                include: [
                    { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
                    { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
                ]
            });

            // Emit real-time notification
            emitNotification('lead_created', {
                lead: leadWithRelations,
                createdBy: req.user.name
            }, leadData.assignedToId);

            // Send email notification to assigned user
            if (leadWithRelations.assignedTo?.email) {
                try {
                    await sendEmailNotification({
                        to: leadWithRelations.assignedTo.email,
                        subject: `New Lead Assigned: ${lead.name}`,
                        text: `A new lead "${lead.name}" has been assigned to you by ${req.user.name}.`,
                        html: `
                            <h2>New Lead Assigned</h2>
                            <p>A new lead has been assigned to you:</p>
                            <ul>
                                <li><strong>Name:</strong> ${lead.name}</li>
                                <li><strong>Email:</strong> ${lead.email}</li>
                                <li><strong>Status:</strong> ${lead.status}</li>
                                <li><strong>Assigned by:</strong> ${req.user.name}</li>
                            </ul>
                        `
                    });
                } catch (emailError) {
                    console.error('Email notification error:', emailError);
                    // Don't fail the request if email fails
                }
            }

            // Send to third-party integrations
            await sendToHubSpot('lead_created', { lead: leadWithRelations, createdBy: req.user.name });
            await sendToSlack('lead_created', { lead: leadWithRelations, createdBy: req.user.name });

            res.status(201).json({ message: 'Lead created successfully', lead: leadWithRelations });
        } catch (error) {
            console.error('Error creating lead:', error);
            res.status(500).json({ message: 'Error creating lead', error: error.message });
        }
    }
);

// Update lead
router.put('/:id',
    [
        body('name').optional().trim().notEmpty(),
        body('email').optional().isEmail(),
        body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
        body('assignedToId').optional().isUUID()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const lead = await Lead.findByPk(req.params.id);
            if (!lead) {
                return res.status(404).json({ message: 'Lead not found' });
            }

            // Sales Executive can edit any lead (removed restriction)

            const oldStatus = lead.status;
            const oldAssignedTo = lead.assignedToId;

            await lead.update(req.body);
            await lead.reload();

            // Create activity for status change
            if (req.body.status && req.body.status !== oldStatus) {
                await Activity.create({
                    type: 'Status Change',
                    title: 'Status Updated',
                    description: `Status changed from "${oldStatus}" to "${req.body.status}"`,
                    leadId: lead.id,
                    userId: req.user.id,
                    metadata: { oldStatus, newStatus: req.body.status }
                });

                // Send email notification for status change
                const assignedUser = await User.findByPk(lead.assignedToId);
                if (assignedUser?.email) {
                    try {
                        await sendEmailNotification({
                            to: assignedUser.email,
                            subject: `Lead Status Updated: ${lead.name}`,
                            text: `The status of lead "${lead.name}" has been changed from "${oldStatus}" to "${req.body.status}" by ${req.user.name}.`,
                            html: `
                                <h2>Lead Status Updated</h2>
                                <p>The status of lead <strong>${lead.name}</strong> has been updated:</p>
                                <ul>
                                    <li><strong>Previous Status:</strong> ${oldStatus}</li>
                                    <li><strong>New Status:</strong> ${req.body.status}</li>
                                    <li><strong>Updated by:</strong> ${req.user.name}</li>
                                </ul>
                            `
                        });
                    } catch (emailError) {
                        console.error('Email notification error:', emailError);
                    }
                }
            }

            // Create activity for assignment change
            if (req.body.assignedToId && req.body.assignedToId !== oldAssignedTo) {
                const newAssignee = await User.findByPk(req.body.assignedToId);
                await Activity.create({
                    type: 'Note',
                    title: 'Lead Reassigned',
                    description: `Lead reassigned to ${newAssignee?.name || 'another user'}`,
                    leadId: lead.id,
                    userId: req.user.id
                });

                const updatedLead = await Lead.findByPk(lead.id, {
                    include: [{ model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] }]
                });

                // Emit real-time notification to new assignee
                emitNotification('lead_assigned', {
                    lead: updatedLead,
                    assignedBy: req.user.name
                }, req.body.assignedToId);

                // Send email notification to new assignee
                if (newAssignee?.email) {
                    try {
                        await sendEmailNotification({
                            to: newAssignee.email,
                            subject: `Lead Assigned to You: ${lead.name}`,
                            text: `Lead "${lead.name}" has been assigned to you by ${req.user.name}.`,
                            html: `
                                <h2>Lead Assigned to You</h2>
                                <p>The following lead has been assigned to you:</p>
                                <ul>
                                    <li><strong>Name:</strong> ${lead.name}</li>
                                    <li><strong>Email:</strong> ${lead.email}</li>
                                    <li><strong>Status:</strong> ${lead.status}</li>
                                    <li><strong>Assigned by:</strong> ${req.user.name}</li>
                                </ul>
                            `
                        });
                    } catch (emailError) {
                        console.error('Email notification error:', emailError);
                    }
                }

                // Send to third-party integrations
                await sendToSlack('lead_assigned', { lead: updatedLead, assignedBy: req.user.name });
            }

            const updatedLead = await Lead.findByPk(lead.id, {
                include: [
                    { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
                    { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
                ]
            });

            res.json({ message: 'Lead updated successfully', lead: updatedLead });
        } catch (error) {
            console.error('Error updating lead:', error);
            res.status(500).json({ message: 'Error updating lead', error: error.message });
        }
    }
);

// Delete lead (Admin, Manager, and Sales Executive can delete)
router.delete('/:id', async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) {
            return res.status(404).json({ message: 'Lead not found' });
        }

        await lead.destroy();
        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ message: 'Error deleting lead', error: error.message });
    }
});

module.exports = router;

