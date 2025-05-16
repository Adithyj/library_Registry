const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const { login, getDashboardStats, getRecentEntries } = require('../controllers/adminController');
const { uploadStudentCSV, downloadCSVTemplate } = require('../controllers/studentImportController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Set up multer upload
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Admin login route (no auth required)
router.post('/login', login);

// Protected routes (require admin authentication)
// Apply the middleware to all routes AFTER this point
router.use(authenticateAdmin);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/recent-entries', getRecentEntries);

// GET admin profile
router.get('/profile', async (req, res) => {
    try {
        // req.admin is set by the authenticateAdmin middleware
        const { id, email } = req.admin;
        
        // For now, just return the admin info from the token
        // In a real app, you might fetch more details from the database
        res.json({
            success: true,
            profile: {
                id,
                email,
                name: 'Library Admin'
            }
        });
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch admin profile',
            error: error.message
        });
    }
});

// Student import routes
router.get('/student-import/template', downloadCSVTemplate);
router.post('/student-import/upload', upload.single('file'), uploadStudentCSV);

module.exports = router; 