const express = require('express');
const router = express.Router();
const Student = require('../model/Student');
const LibraryEntry = require('../model/LibraryEntry');

// Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update all semesters
router.post('/update-semesters', async (req, res) => {
    try {
        await Student.updateMany({}, { $inc: { semester: 1 } });
        await LibraryEntry.updateMany({ exit_time: null }, { $inc: { semester: 1 } });
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
        await Student.updateOne({ usn }, { $set: { semester } });
        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
