const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Admin login controller
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        // Hard-coded admin credentials
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'bharathi.library@sahyadri.edu.in';
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'librarian_101';

        // Validate credentials
        if (email !== ADMIN_EMAIL) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password (simple comparison for now)
        const isPasswordValid = password === ADMIN_PASSWORD;
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: 'admin', email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        // Return success with token
        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            admin: {
                email,
                name: 'Library Admin'
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
}

/**
 * Get dashboard statistics
 */
async function getDashboardStats(req, res) {
    try {
        // Get total number of students
        const studentsQuery = 'SELECT COUNT(*) as total_students FROM students';
        const studentsResult = await db.query(studentsQuery);
        
        // Get total number of active entries (students currently in library)
        const activeEntriesQuery = 'SELECT COUNT(*) as active_entries FROM library_entries WHERE exit_time IS NULL';
        const activeEntriesResult = await db.query(activeEntriesQuery);
        
        // Get total entries for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayEntriesQuery = 'SELECT COUNT(*) as today_entries FROM library_entries WHERE entry_time >= $1';
        const todayEntriesResult = await db.query(todayEntriesQuery, [today]);
        
        // Default empty arrays for distribution data in case of error
        let deptResult = { rows: [] };
        let semesterResult = { rows: [] };
        
        try {
            // Get department-wise distribution
            const deptQuery = `
                SELECT department, COUNT(*) as count 
                FROM students 
                GROUP BY department 
                ORDER BY count DESC
            `;
            deptResult = await db.query(deptQuery);
        } catch (err) {
            console.error('Error fetching department distribution:', err);
            // Continue with empty array
        }
        
        try {
            // Get semester-wise distribution
            const semesterQuery = `
                SELECT semester, COUNT(*) as count 
                FROM students 
                GROUP BY semester 
                ORDER BY semester
            `;
            semesterResult = await db.query(semesterQuery);
        } catch (err) {
            console.error('Error fetching semester distribution:', err);
            // Continue with empty array
        }
        
        // Return all stats with safe fallbacks if data is missing
        res.json({
            success: true,
            stats: {
                totalStudents: parseInt(studentsResult.rows[0]?.total_students || 0),
                activeEntries: parseInt(activeEntriesResult.rows[0]?.active_entries || 0),
                todayEntries: parseInt(todayEntriesResult.rows[0]?.today_entries || 0),
                departmentDistribution: deptResult.rows || [],
                semesterDistribution: semesterResult.rows || []
            }
        });
        
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch dashboard statistics',
            error: error.message 
        });
    }
}

/**
 * Get recent library entries
 */
async function getRecentEntries(req, res) {
    try {
        const query = `
            SELECT le.id, le.entry_time, le.exit_time, le.duration,
                   s.usn, s.name, s.department, s.semester 
            FROM library_entries le
            JOIN students s ON le.student_usn = s.usn
            ORDER BY le.entry_time DESC
            LIMIT 10
        `;
        
        const result = await db.query(query);
        
        res.json({
            success: true,
            entries: result.rows
        });
        
    } catch (error) {
        console.error('Error fetching recent entries:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch recent entries' 
        });
    }
}

module.exports = {
    login,
    getDashboardStats,
    getRecentEntries
}; 