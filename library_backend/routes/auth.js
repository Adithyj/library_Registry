const express = require('express');
const router = express.Router();
const Admin = require('../model/Admin');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Admin login route
router.post('/admin/login', async (req, res) => {
    // Ensure content type is set correctly
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const { email, password } = req.body;

        // Log the login attempt (without password)
        console.log(`Login attempt: ${email}`);

        // Validate request
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[a-zA-Z0-9.]+\.library@sahyadri\.edu\.in$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please enter a valid email in format: name.library@sahyadri.edu.in' 
            });
        }

        // Extract username from email (for matching with database)
        const username = email.split('.library@')[0];

        // Find admin by username
        const admin = await Admin.findByUsername(username);
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Verify password
        const isPasswordValid = await Admin.verifyPassword(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate JWT token
        const token = Admin.generateToken(admin.id, admin.username);

        // Return success with token and admin info
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                name: admin.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'production' ? undefined : error.message
        });
    }
});

// Verify admin token (for protected routes)
router.get('/admin/verify', async (req, res) => {
    // Ensure content type is set correctly
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided or invalid format' 
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'library_secret_key');
        
        // Check if token contains admin role
        if (decoded.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized as admin'
            });
        }
        
        // Get admin details from database to verify they still exist
        const admin = await Admin.findByUsername(decoded.username);
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin account no longer exists'
            });
        }
        
        // Token is valid and admin exists
        return res.status(200).json({
            success: true,
            message: 'Token is valid',
            admin: {
                id: admin.id,
                username: admin.username,
                email: admin.email,
                name: admin.name
            }
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ 
            success: false, 
            message: error.name === 'TokenExpiredError' 
                ? 'Token has expired' 
                : 'Invalid token' 
        });
    }
});

module.exports = router;
