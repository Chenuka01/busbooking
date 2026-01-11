const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');
const crypto = require('crypto');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, phone } = req.body;

        // Validation
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and full name are required'
            });
        }

        // Check if user already exists
        const [existingUser] = await db.query(
            'SELECT id FROM Users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            `INSERT INTO Users (email, password_hash, full_name, phone, role) 
             VALUES (?, ?, ?, ?, 'user')`,
            [email, passwordHash, fullName, phone || null]
        );

        // Send welcome email (non-blocking)
        sendWelcomeEmail({ email, name: fullName }).catch(err => 
            console.error('Welcome email error:', err)
        );

        // Generate token
        const token = jwt.sign(
            { userId: result.insertId, email, role: 'user' },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: {
                    id: result.insertId,
                    email,
                    fullName,
                    phone,
                    role: 'user'
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        const [users] = await db.query(
            'SELECT id, email, password_hash, full_name, phone, role, is_active FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const user = users[0];

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is disabled. Please contact support.'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        await db.query(
            'UPDATE Users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * GET /api/auth/verify
 * Verify token and get user info
 */
router.get('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Get fresh user data
        const [users] = await db.query(
            'SELECT id, email, full_name, phone, role, is_active FROM Users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0 || !users[0].is_active) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
        }

        const user = users[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    phone: user.phone,
                    role: user.role
                }
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});


/**
 * POST /api/auth/forgot
 * Request password reset OTP
 */
router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email required' });

        // Check user exists
        const [users] = await db.query('SELECT id, full_name FROM Users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
        const user = users[0];

        // Ensure PasswordResets table exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS PasswordResets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Insert reset record
        await db.query('INSERT INTO PasswordResets (email, otp, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);

        // Send email
        sendPasswordResetEmail({ email, name: user.full_name, otp }).catch(err => console.error('Password reset email error:', err));

        res.json({ success: true, message: 'Password reset OTP sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP (email + otp)
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

        const [rows] = await db.query('SELECT id, expires_at, used FROM PasswordResets WHERE email = ? AND otp = ? ORDER BY created_at DESC LIMIT 1', [email, otp]);
        if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        const rec = rows[0];
        if (rec.used) return res.status(400).json({ success: false, message: 'OTP already used' });
        if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

        res.json({ success: true, message: 'OTP valid' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
    }
});

/**
 * POST /api/auth/reset
 * Reset password using OTP
 */
router.post('/reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP and new password required' });

        const [rows] = await db.query('SELECT id, expires_at, used FROM PasswordResets WHERE email = ? AND otp = ? ORDER BY created_at DESC LIMIT 1', [email, otp]);
        if (rows.length === 0) return res.status(400).json({ success: false, message: 'Invalid OTP' });
        const rec = rows[0];
        if (rec.used) return res.status(400).json({ success: false, message: 'OTP already used' });
        if (new Date(rec.expires_at) < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });

        // Hash new password and update
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE Users SET password_hash = ? WHERE email = ?', [hash, email]);

        // Mark OTP used
        await db.query('UPDATE PasswordResets SET used = TRUE WHERE id = ?', [rec.id]);

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password', error: error.message });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { fullName, phone } = req.body;
        const userId = req.user.userId;

        // Validation
        if (!fullName || fullName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Full name must be at least 2 characters long'
            });
        }

        // Update user profile
        const [result] = await db.query(
            'UPDATE Users SET full_name = ?, phone = ? WHERE id = ?',
            [fullName.trim(), phone || null, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get updated user data
        const [users] = await db.query(
            'SELECT id, email, full_name, phone, role FROM Users WHERE id = ?',
            [userId]
        );

        const updatedUser = users[0];

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    fullName: updatedUser.full_name,
                    phone: updatedUser.phone,
                    role: updatedUser.role
                }
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
});

module.exports = router;
