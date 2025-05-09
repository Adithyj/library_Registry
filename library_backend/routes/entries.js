// routes/entries.js
const express = require('express');
const router = express.Router();
const LibraryEntry = require('../model/LibraryEntry');
const Student = require('../model/Student');

// ➡️ Check-in
// Check-in
// Check-in
router.post('/check-in', async (req, res) => {
  const { usn } = req.body;

  if (!usn) {
      return res.status(400).json({ error: 'USN is required for check-in' });
  }

  try {
      let student = await Student.findOne({ usn });

      // If student does not exist, prompt for details and create a new entry
      if (!student) {
          console.log(`Student with USN ${usn} not found. Please provide details to register.`);

          // Request additional details
          const { name, department, semester, email, phone } = req.body;

          if (!name || !department || !semester) {
              return res.status(400).json({
                  error: 'Student not found. Please provide name, department, and semester to register.'
              });
          }

          // 🛠️ Call the Student API internally
          try {
              const response = await axios.post('http://localhost:5000/students', {
                  usn,
                  name,
                  department,
                  semester,
                  email,
                  phone
              });

              student = response.data.student;
              console.log(`New student registered: ${name}`);
          } catch (err) {
              console.error('Error creating student:', err.message);
              return res.status(500).json({ error: 'Failed to create student' });
          }
      }

      // Check if the student is already checked in (i.e., has an active entry)
      const existingEntry = await LibraryEntry.findOne({ student_usn: usn, exit_time: null });

      if (existingEntry) {
          return res.status(400).json({
              error: 'Student is already checked in. Please check out first before checking in again.'
          });
      }

      // Create Library Entry for check-in
      const newEntry = new LibraryEntry({
          student_usn: usn,
          semester: student.semester
      });

      await newEntry.save();

      // Respond with student details
      res.json({
          message: 'Check-in successful',
          student: {
              name: student.name,
              department: student.department,
              semester: student.semester,
              usn: student.usn
          }
      });

  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});


// ➡️ Check-out
router.post('/check-out', async (req, res) => {
    const { usn, bookNumber } = req.body;

    try {
        const filter = { student_usn: usn, exit_time: null };
        if (bookNumber) filter.book_number = bookNumber;

        const entry = await LibraryEntry.findOne(filter).sort({ entry_time: -1 });
        if (!entry) return res.status(404).json({ error: 'No active check-in found' });

        entry.exit_time = new Date();
        entry.duration = Math.floor((new Date() - new Date(entry.entry_time)) / 60000);
        await entry.save();

        res.json({ message: 'Check-out successful', duration: `${entry.duration} minutes` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
