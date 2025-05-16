const db = require('../db');

/**
 * Student model for PostgreSQL
 */
class Student {
  // Create a new student
  static async create(studentData) {
    try {
      const { usn, name, department, semester, email, phone } = studentData;
      
      // Use transaction for data integrity
      return await db.withTransaction(async (client) => {
        const query = `
          INSERT INTO students (usn, name, department, semester, email, phone)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const values = [usn, name, department, semester, email, phone];
        const result = await client.query(query, values);
        return result.rows[0];
      });
    } catch (err) {
      console.error('Error creating student:', err.message);
      throw err;
    }
  }

  // Find student by USN
  static async findByUsn(usn) {
    const query = 'SELECT * FROM students WHERE usn = $1';
    const result = await db.query(query, [usn]);
    return result.rows[0] || null;
  }

  // Find all students
  static async findAll() {
    const query = 'SELECT * FROM students ORDER BY name';
    const result = await db.query(query);
    return result.rows;
  }

  // Update a student
  static async update(usn, updateData) {
    try {
      // Use transaction for data integrity
      return await db.withTransaction(async (client) => {
        // Build dynamic query based on provided fields
        const fields = Object.keys(updateData);
        if (fields.length === 0) return await this.findByUsn(usn);
        
        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const values = fields.map(field => updateData[field]);
        
        const query = `
          UPDATE students
          SET ${setClause}
          WHERE usn = $1
          RETURNING *
        `;
        
        const result = await client.query(query, [usn, ...values]);
        return result.rows[0] || null;
      });
    } catch (err) {
      console.error('Error updating student:', err.message);
      throw err;
    }
  }

  // Delete a student
  static async delete(usn) {
    try {
      // Use transaction for data integrity
      return await db.withTransaction(async (client) => {
        // First check for any active library entries
        const activeEntriesQuery = `
          SELECT * FROM library_entries
          WHERE student_usn = $1 AND exit_time IS NULL
        `;
        const entriesResult = await client.query(activeEntriesQuery, [usn]);
        
        if (entriesResult.rows.length > 0) {
          throw new Error('Cannot delete student with active library entries');
        }
        
        // Delete the student
        const deleteQuery = 'DELETE FROM students WHERE usn = $1 RETURNING *';
        const result = await client.query(deleteQuery, [usn]);
        return result.rows[0] || null;
      });
    } catch (err) {
      console.error('Error deleting student:', err.message);
      throw err;
    }
  }
  
  // Student stats by department
  static async getStatsByDepartment() {
    const query = `
      SELECT department, COUNT(*) as count 
      FROM students 
      GROUP BY department
      ORDER BY count DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
  
  // Student stats by semester
  static async getStatsBySemester() {
    const query = `
      SELECT semester, COUNT(*) as count 
      FROM students 
      GROUP BY semester
      ORDER BY semester
    `;
    const result = await db.query(query);
    return result.rows;
  }

  // Search students by USN (case-insensitive)
  static async search(query) {
    try {
      // Use the fast-failing queryReadOnly for search operations
      // which provides empty results instead of timing out
      const sqlQuery = 'SELECT * FROM students WHERE usn ILIKE $1 LIMIT 5';
      const result = await db.queryReadOnly(sqlQuery, [`%${query}%`], []);
      return result.rows;
    } catch (err) {
      console.error('Search error:', err.message);
      // Return empty array rather than failing the request
      return [];
    }
  }
}

module.exports = Student;
