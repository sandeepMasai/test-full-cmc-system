const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Sequelize, Op } = require('sequelize');
const { User } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendEmailNotification } = require('../utils/emailService');
const { emitNotification } = require('../socket/socketHandler');

const router = express.Router();

// Public registration endpoint (allows role selection)
router.post('/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['Admin', 'Manager', 'Sales Executive']).withMessage('Invalid role')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages, errors: errors.array() });
            }

            const { name, email, password, role } = req.body;

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }

            // Allow role selection for public registration
            // Default to Sales Executive if not provided
            const finalRole = role || 'Sales Executive';

            const user = await User.create({
                name,
                email,
                password,
                role: finalRole
            });

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            // Send welcome email to new user
            try {
                await sendEmailNotification({
                    to: user.email,
                    subject: 'Welcome to CRM System',
                    text: `Welcome ${user.name}! Your account has been successfully created with role: ${user.role}.`,
                    html: `
                        <h2>Welcome to CRM System!</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your account has been successfully created.</p>
                        <ul>
                            <li><strong>Email:</strong> ${user.email}</li>
                            <li><strong>Role:</strong> ${user.role}</li>
                        </ul>
                        <p>You can now log in and start using the CRM system.</p>
                    `
                });
            } catch (emailError) {
                console.error('Welcome email error:', emailError);
                // Don't fail registration if email fails
            }

            // Emit notification for admin users about new registration
            emitNotification('user_registered', {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }
);

// Admin-only endpoint to create users with any role
router.post('/admin/register',
    authenticateToken,
    authorizeRoles('Admin'),
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['Admin', 'Manager', 'Sales Executive']).withMessage('Invalid role')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages, errors: errors.array() });
            }

            const { name, email, password, role } = req.body;

            // Prevent Manager from creating Admin users
            if (req.user.role === 'Manager' && role === 'Admin') {
                return res.status(403).json({ message: 'Managers cannot create Admin users' });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'User with this email already exists' });
            }

            const user = await User.create({
                name,
                email,
                password,
                role: role || 'Sales Executive'
            });

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            res.status(201).json({
                message: 'User created successfully',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }
);

// Login
router.post('/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages, errors: errors.array() });
            }

            const { email, password } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            if (!user.isActive) {
                return res.status(401).json({ message: 'Account is deactivated. Please contact administrator.' });
            }

            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRE || '7d' }
            );

            // Send login notification email
            try {
                await sendEmailNotification({
                    to: user.email,
                    subject: 'Login Notification - CRM System',
                    text: `Hello ${user.name}, you have successfully logged into the CRM System at ${new Date().toLocaleString()}.`,
                    html: `
                        <h2>Login Notification</h2>
                        <p>Hello ${user.name},</p>
                        <p>You have successfully logged into the CRM System.</p>
                        <ul>
                            <li><strong>Login Time:</strong> ${new Date().toLocaleString()}</li>
                            <li><strong>Email:</strong> ${user.email}</li>
                            <li><strong>Role:</strong> ${user.role}</li>
                        </ul>
                        <p>If you did not perform this login, please contact your administrator immediately.</p>
                    `
                });
            } catch (emailError) {
                console.error('Login email notification error:', emailError);
                // Don't fail login if email fails
            }

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Error during login', error: error.message });
        }
    }
);

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Error during logout', error: error.message });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Get all users for assignment (all authenticated users can access this)
// Returns basic user info for lead assignment, etc.
router.get('/users/list', authenticateToken, async (req, res) => {
    try {
        const users = await User.findAll({
            where: { isActive: true },
            attributes: ['id', 'name', 'email', 'role'],
            order: [['name', 'ASC']]
        });

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Get all users (Admin/Manager only) - full user details
router.get('/users', authenticateToken, authorizeRoles('Admin', 'Manager'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password', 'resetToken'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// Update user (Admin/Manager only)
router.put('/users/:id',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').optional().isIn(['Admin', 'Manager', 'Sales Executive']).withMessage('Invalid role'),
        body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages, errors: errors.array() });
            }

            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent Manager from creating/updating Admin users
            if (req.body.role === 'Admin' && req.user.role === 'Manager') {
                return res.status(403).json({ message: 'Managers cannot create or update Admin users' });
            }

            // Prevent Admin from being demoted (only if current user is not Admin)
            if (req.body.role && user.role === 'Admin' && req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Cannot modify Admin user' });
            }

            // Update user
            const updateData = {};
            if (req.body.name) updateData.name = req.body.name;
            if (req.body.email) {
                // Check if email is already taken by another user
                const existingUser = await User.findOne({
                    where: {
                        email: req.body.email,
                        id: { [Op.ne]: req.params.id }
                    }
                });
                if (existingUser) {
                    return res.status(400).json({ message: 'Email already in use' });
                }
                updateData.email = req.body.email;
            }
            if (req.body.password) {
                // Password will be hashed by beforeUpdate hook
                updateData.password = req.body.password;
            }
            if (req.body.role) updateData.role = req.body.role;
            if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

            await user.update(updateData);

            const updatedUser = await User.findByPk(req.params.id, {
                attributes: { exclude: ['password', 'resetToken'] }
            });

            res.json({ message: 'User updated successfully', user: updatedUser });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: 'Error updating user', error: error.message });
        }
    }
);

// Delete user (Admin/Manager only)
router.delete('/users/:id',
    authenticateToken,
    authorizeRoles('Admin', 'Manager'),
    async (req, res) => {
        try {
            const user = await User.findByPk(req.params.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Prevent deleting yourself
            if (user.id === req.user.id) {
                return res.status(400).json({ message: 'Cannot delete your own account' });
            }

            // Prevent deleting Admin users (only if current user is not Admin)
            if (user.role === 'Admin' && req.user.role !== 'Admin') {
                return res.status(403).json({ message: 'Cannot delete Admin user' });
            }

            await user.destroy();
            res.json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Error deleting user', error: error.message });
        }
    }
);

// Forgot password - Request password reset
router.post('/forgot-password',
    [
        body('email').isEmail().withMessage('Valid email is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages });
            }

            const { email } = req.body;

            const user = await User.findOne({ where: { email } });

            // Always return success message for security (don't reveal if email exists)
            if (!user) {
                return res.json({
                    message: 'If an account with that email exists, a password reset link has been sent.'
                });
            }

            // Generate reset token
            const crypto = require('crypto');
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

            user.resetToken = resetToken;
            user.resetTokenExpiry = resetTokenExpiry;
            await user.save();

            // Send reset email
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

            try {
                await sendEmailNotification({
                    to: user.email,
                    subject: 'Password Reset Request - CRM System',
                    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>Hello ${user.name},</p>
                        <p>You requested a password reset for your CRM account.</p>
                        <p>Click the button below to reset your password:</p>
                        <p style="margin: 20px 0;">
                            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Reset Password
                            </a>
                        </p>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                        <p><strong>This link will expire in 1 hour.</strong></p>
                        <p>If you did not request this password reset, please ignore this email.</p>
                    `
                });
            } catch (emailError) {
                console.error('Error sending reset email:', emailError);
                // Still return success for security
            }

            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ message: 'Error processing password reset request', error: error.message });
        }
    }
);

// Reset password - Set new password with token
router.post('/reset-password',
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const errorMessages = errors.array().map(err => err.msg).join(', ');
                return res.status(400).json({ message: errorMessages });
            }

            const { token, password } = req.body;

            const user = await User.findOne({
                where: {
                    resetToken: token,
                    resetTokenExpiry: {
                        [Op.gt]: new Date() // Token not expired
                    }
                }
            });

            if (!user) {
                return res.status(400).json({
                    message: 'Invalid or expired reset token. Please request a new password reset.'
                });
            }

            // Update password (will be hashed by beforeUpdate hook)
            user.password = password;
            user.resetToken = null;
            user.resetTokenExpiry = null;
            await user.save();

            // Send confirmation email
            try {
                await sendEmailNotification({
                    to: user.email,
                    subject: 'Password Reset Successful - CRM System',
                    text: `Your password has been successfully reset. If you did not make this change, please contact support immediately.`,
                    html: `
                        <h2>Password Reset Successful</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your password has been successfully reset.</p>
                        <p>If you did not make this change, please contact support immediately.</p>
                    `
                });
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
            }

            res.json({ message: 'Password has been reset successfully' });
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ message: 'Error resetting password', error: error.message });
        }
    }
);

module.exports = router;

