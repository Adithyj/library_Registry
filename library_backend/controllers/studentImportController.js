const { parseStudentCSV } = require('../utils/csvParser');
const { importStudents, getCSVTemplate } = require('../utils/studentBulkImport');
const fs = require('fs');
const path = require('path');

/**
 * Handle CSV file upload and processing for student imports
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function uploadStudentCSV(req, res) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // Parse the CSV file
    const filePath = req.file.path;
    const parseResults = await parseStudentCSV(filePath);
    
    // Check if there are any valid students to import
    if (parseResults.validCount === 0) {
      // Delete the uploaded file
      fs.unlinkSync(filePath);
      
      return res.status(400).json({
        success: false,
        message: 'No valid student records found in the CSV',
        errors: parseResults.errors
      });
    }
    
    // Import valid students to the database
    const importResults = await importStudents(parseResults.students);
    
    // Delete the uploaded file
    fs.unlinkSync(filePath);
    
    // Return the results
    return res.status(200).json({
      success: true,
      message: `Successfully processed ${importResults.successCount} out of ${importResults.totalCount} students`,
      results: {
        total: importResults.totalCount,
        successful: importResults.successCount,
        failed: importResults.failureCount,
        errors: parseResults.errors,
        failedRecords: importResults.failed
      }
    });
  } catch (error) {
    console.error('Error processing student CSV:', error);
    
    // Clean up the file if it exists
    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore */ }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process the CSV file',
      error: error.message
    });
  }
}

/**
 * Download a CSV template for student imports
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function downloadCSVTemplate(req, res) {
  try {
    const template = getCSVTemplate();
    
    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.csv');
    
    // Send the template
    return res.status(200).send(template);
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate CSV template',
      error: error.message
    });
  }
}

module.exports = {
  uploadStudentCSV,
  downloadCSVTemplate
}; 