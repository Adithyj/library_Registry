const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all students
router.get('/', async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT usn, name, department, semester FROM students'
    );
    res.json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update all semesters
router.post('/update-semesters', async (req, res) => {
  try {
    await pool.query('UPDATE students SET semester = semester + 1');
    await pool.query('UPDATE library_entries SET semester = semester + 1 WHERE exit_time IS NULL');
    res.json({ message: 'All students advanced to next semester' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update individual student
router.put('/:usn', async (req, res) => {
  const { usn } = req.params;
  const { semester } = req.body;
  
  try {
    await pool.query('UPDATE students SET semester = ? WHERE usn = ?', [semester, usn]);
    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;