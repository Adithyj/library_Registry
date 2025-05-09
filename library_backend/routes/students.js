// routes/student.js
const express = require('express');
const router = express.Router();
const Student = require('../model/Student');

// ➡️ Create a new student
router.post('/', async (req, res) => {
    const { usn, name, department, semester, email, phone } = req.body;
    if (!usn || !name || !department || !semester) {
        return res.status(400).json({ message: 'Missing required fields: usn, name, department, semester' });
    }

    try {
        const newStudent = new Student({ usn, name, department, semester, email, phone });
        await newStudent.save();
        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    } catch (err) {
        res.status(500).json({ message: 'Error creating student', error: err.message });
    }
});

// ➡️ Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.find();
        res.status(200).json(students);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching students', error: err.message });
    }
});

// ➡️ Get a student by USN
router.get('/:usn', async (req, res) => {
    try {
        const student = await Student.findOne({ usn: req.params.usn });
        student ? res.status(200).json(student) : res.status(404).json({ message: 'Student not found' });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching student', error: err.message });
    }
});

// ➡️ Update a student
router.put('/:usn', async (req, res) => {
    try {
        const updatedStudent = await Student.findOneAndUpdate({ usn: req.params.usn }, req.body, { new: true });
        updatedStudent ? res.status(200).json(updatedStudent) : res.status(404).json({ message: 'Student not found' });
    } catch (err) {
        res.status(500).json({ message: 'Error updating student', error: err.message });
    }
});

// ➡️ Delete a student
router.delete('/:usn', async (req, res) => {
    try {
        const deletedStudent = await Student.findOneAndDelete({ usn: req.params.usn });
        deletedStudent ? res.status(200).json(deletedStudent) : res.status(404).json({ message: 'Student not found' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting student', error: err.message });
    }
});

module.exports = router;
