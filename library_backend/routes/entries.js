const express = require('express');
const router = express.Router();
const LibraryEntry = require('../model/LibraryEntry');
const Student = require('../model/Student');

// Check-in
router.post('/check-in', async (req, res) => {
    const { usn, bookNumber } = req.body;

    try {
        const student = await Student.findOne({ usn });

        if (!student) return res.status(404).json({ error: 'Student not found' });

        const newEntry = new LibraryEntry({
            student_usn: usn,
            book_number: bookNumber || null,
            semester: student.semester
        });

        await newEntry.save();

        res.json({
            message: 'Check-in successful',
            student: {
                name: student.name,
                department: student.department,
                semester: student.semester,
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
        const filter = { student_usn: usn, exit_time: null };
        if (bookNumber) filter.book_number = bookNumber;

        const entry = await LibraryEntry.findOne(filter).sort({ entry_time: -1 });

        if (!entry) {
            return res.status(404).json({
                error: bookNumber ? 'No active book checkout found' : 'No active check-in found'
            });
        }

        const duration = Math.floor((new Date() - new Date(entry.entry_time)) / 60000);
        entry.exit_time = new Date();
        entry.duration = duration;
        await entry.save();

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
