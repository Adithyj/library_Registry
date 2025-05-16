const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { uploadStudentCSV, downloadCSVTemplate } = require('../controllers/studentImportController');

const router = express.Router();

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

// Admin routes
// Apply authentication middleware to all admin routes
router.use(authMiddleware.authenticateAdmin);

// Route for admin login (handled separately)
router.post('/login', require('../controllers/adminController').login);

// Route for CSV template download
router.get('/student-import/template', downloadCSVTemplate);

// Route for CSV upload
router.post('/student-import/upload', upload.single('file'), uploadStudentCSV);

module.exports = router; 