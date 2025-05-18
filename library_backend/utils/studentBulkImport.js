const db = require('../db');

/**
 * Import a list of students into the database
 * 
 * @param {Array} students - Array of validated student objects
 * @returns {Promise<Object>} Result of the import operation
 */
async function importStudents(students) {
  const results = {
    successful: [],
    failed: [],
    totalCount: students.length,
    successCount: 0,
    failureCount: 0
  };
  
  // Create a client from the pool
  const client = await db.getDedicatedClient();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    for (const student of students) {
      try {
        // Check if student already exists
        const checkQuery = 'SELECT usn FROM students WHERE usn = $1';
        const checkResult = await client.query(checkQuery, [student.usn]);
        
        if (checkResult.rowCount > 0) {
          // Student exists, update
          const updateQuery = `
            UPDATE students 
            SET name = $1, email = $2, department = $3, semester = $4, phone = $5
            WHERE usn = $6
            RETURNING *
          `;
          
          const updateValues = [
            student.name,
            student.email,
            student.department,
            student.semester,
            student.phone,
            student.usn
          ];
          
          const updateResult = await client.query(updateQuery, updateValues);
          results.successful.push({
            usn: student.usn,
            action: 'updated',
            data: updateResult.rows[0]
          });
        } else {
          // Insert new student
          const insertQuery = `
            INSERT INTO students (usn, name, email, department, semester, phone)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
          `;
          
          const insertValues = [
            student.usn,
            student.name,
            student.email,
            student.department,
            student.semester,
            student.phone
          ];
          
          const insertResult = await client.query(insertQuery, insertValues);
          results.successful.push({
            usn: student.usn,
            action: 'inserted',
            data: insertResult.rows[0]
          });
        }
        
        results.successCount++;
      } catch (error) {
        results.failed.push({
          usn: student.usn,
          error: error.message
        });
        results.failureCount++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Release client back to pool
    client.release();
  }
  
  return results;
}

/**
 * Generate a CSV template for student import
 * 
 * @returns {string} CSV header string
 */
function getCSVTemplate() {
  return 'usn,name,branch,semester,email,phone';
}

module.exports = {
  importStudents,
  getCSVTemplate
}; 