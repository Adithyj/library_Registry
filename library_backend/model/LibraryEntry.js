const db = require('../db');

/**
 * LibraryEntry model for PostgreSQL
 */
class LibraryEntry {
  // Create a new library entry
  static async create(entryData) {
    const { student_usn, book_number, entry_time = new Date(), semester } = entryData;
    
    try {
      // Use transaction for data integrity
      return await db.withTransaction(async (client) => {
        const query = `
          INSERT INTO library_entries (student_usn, book_number, entry_time, semester)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        const values = [student_usn, book_number, entry_time, semester];
        const result = await client.query(query, values);
        return result.rows[0];
      });
    } catch (err) {
      console.error('Error creating library entry:', err.message);
      throw err;
    }
  }

  // Find all library entries
  static async findAll() {
    const query = 'SELECT * FROM library_entries ORDER BY entry_time DESC';
    const result = await db.query(query);
    return result.rows;
  }

  // Find entries by student USN
  static async findByStudentUsn(usn) {
    const query = 'SELECT * FROM library_entries WHERE student_usn = $1 ORDER BY entry_time DESC';
    const result = await db.query(query, [usn]);
    return result.rows;
  }

  // Find active entry (with no exit_time) by student USN
  static async findActiveByStudentUsn(usn) {
    const query = 'SELECT * FROM library_entries WHERE student_usn = $1 AND exit_time IS NULL';
    const result = await db.query(query, [usn]);
    return result.rows[0] || null;
  }

  // Update a library entry (for checkout/exit)
  static async update(id, updateData) {
    const { exit_time = new Date(), duration } = updateData;
    
    try {
      // Use transaction for data integrity
      return await db.withTransaction(async (client) => {
        const query = `
          UPDATE library_entries
          SET exit_time = $1, duration = $2
          WHERE id = $3
          RETURNING *
        `;
        const values = [exit_time, duration, id];
        const result = await client.query(query, values);
        return result.rows[0] || null;
      });
    } catch (err) {
      console.error('Error updating library entry:', err.message);
      throw err;
    }
  }
  
  // Get entries for a specific date range
  static async findByDateRange(startDate, endDate) {
    const query = `
      SELECT le.*, s.name, s.department 
      FROM library_entries le
      JOIN students s ON le.student_usn = s.usn
      WHERE le.entry_time BETWEEN $1 AND $2
      ORDER BY le.entry_time DESC
    `;
    const result = await db.query(query, [startDate, endDate]);
    return result.rows;
  }
}

module.exports = LibraryEntry;
