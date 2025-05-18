const fs = require('fs');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');

/**
 * Parse and validate a CSV file containing student information
 * Expected CSV format:
 * usn,name,branch,semester,email,phone
 * 
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} Object containing valid students and errors
 */
async function parseStudentCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowNum = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowNum++;
        const validationResult = validateStudentRow(row, rowNum);
        
        if (validationResult.valid) {
          results.push(validationResult.data);
        } else {
          errors.push(validationResult.error);
        }
      })
      .on('end', () => {
        resolve({
          students: results,
          errors: errors,
          totalProcessed: rowNum,
          validCount: results.length,
          errorCount: errors.length
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Validate a single student row from the CSV
 * 
 * @param {Object} row - Raw row data from CSV
 * @param {number} rowNum - Row number for error reporting
 * @returns {Object} Validation result with valid flag, data or error
 */
function validateStudentRow(row, rowNum) {
  // Required fields
  const requiredFields = ['usn', 'name', 'branch', 'semester', 'email'];
  
  // Check if all required fields exist
  for (const field of requiredFields) {
    if (!row[field] || row[field].trim() === '') {
      return {
        valid: false,
        error: {
          row: rowNum,
          message: `Missing required field: ${field}`,
          data: row
        }
      };
    }
  }
  
  // Validate USN format (adjust pattern as needed)
  const usnPattern = /^[0-9A-Z]{10}$/;
  if (!usnPattern.test(row.usn.trim())) {
    return {
      valid: false,
      error: {
        row: rowNum,
        message: 'Invalid USN format. Must be 10 alphanumeric characters.',
        data: row
      }
    };
  }
  
  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(row.email.trim())) {
    return {
      valid: false,
      error: {
        row: rowNum,
        message: 'Invalid email format.',
        data: row
      }
    };
  }
  
  // Validate semester (must be a number between 1-8)
  const semester = parseInt(row.semester);
  if (isNaN(semester) || semester < 1 || semester > 8) {
    return {
      valid: false,
      error: {
        row: rowNum,
        message: 'Invalid semester. Must be a number between 1-8.',
        data: row
      }
    };
  }
  
  // If we reach here, the data is valid
  // Clean and normalize the data
  return {
    valid: true,
    data: {
      usn: row.usn.trim().toUpperCase(),
      name: row.name.trim(),
      department: row.branch.trim(), // Map branch to department field in database
      semester: semester,
      email: row.email.trim().toLowerCase(),
      phone: row.phone ? row.phone.trim() : null
    }
  };
}

module.exports = {
  parseStudentCSV
}; 