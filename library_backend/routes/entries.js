const express = require('express');
const router = express.Router();
const pool = require('../db');

// Check-in
router.post('/check-in', async (req, res) => {
  const { usn, bookNumber } = req.body;
  
  try {
    const [student] = await pool.query(
      'SELECT name, department, semester FROM students WHERE usn = ?', 
      [usn]
    );
    
    if (!student[0]) return res.status(404).json({ error: 'Student not found' });
    
    await pool.query(
      'INSERT INTO library_entries (student_usn, book_number, entry_time, semester) VALUES (?, ?, NOW(), ?)',
      [usn, bookNumber || null, student[0].semester]
    );
    
    res.json({
      message: 'Check-in successful',
      student: {
        name: student[0].name,
        department: student[0].department,
        semester: student[0].semester,
        usn
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check-out
router.post('/check-out', async (req, res) => {
  const { usn, bookNumber } = req.body;
  
  try {
    const query = bookNumber ? `
      SELECT id, entry_time FROM library_entries 
      WHERE student_usn = ? AND book_number = ? AND exit_time IS NULL
      ORDER BY entry_time DESC LIMIT 1
    ` : `
      SELECT id, entry_time FROM library_entries 
      WHERE student_usn = ? AND exit_time IS NULL AND book_number IS NULL
      ORDER BY entry_time DESC LIMIT 1
    `;
    
    const [result] = await pool.query(query, bookNumber ? [usn, bookNumber] : [usn]);
    
    if (!result[0]) return res.status(404).json({ 
      error: bookNumber ? 'No active book checkout found' : 'No active check-in found' 
    });
    
    const duration = Math.floor((new Date() - new Date(result[0].entry_time)) / 60000);
    
    await pool.query(
      'UPDATE library_entries SET exit_time = NOW(), duration = ? WHERE id = ?',
      [duration, result[0].id]
    );
    
    res.json({
      message: 'Check-out successful',
      duration: `${duration} minutes`,
      bookReturned: !!bookNumber
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;