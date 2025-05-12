const express = require('express');
const router = express.Router();
const axios = require('axios');
const LibraryEntry = require('../model/LibraryEntry');
const Student = require('../model/Student');
const transporter = require('../utils/mailer'); // ✅ Email transporter
require('dotenv').config(); // ✅ To access EMAIL_USER from .env

// ➡️ Check-in
router.post('/check-in', async (req, res) => {
    const { usn } = req.body;

    if (!usn) {
        return res.status(400).json({ error: 'USN is required for check-in' });
    }

    try {
        let student = await Student.findOne({ usn });

        // If student doesn't exist, register
        if (!student) {
            console.log(`Student with USN ${usn} not found. Please provide details to register.`);

            const { name, department, semester, email, phone } = req.body;
            if (!name || !department || !semester) {
                return res.status(400).json({
                    error: 'Student not found. Please provide name, department, and semester to register.'
                });
            }

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

        // Check if already checked in
        const existingEntry = await LibraryEntry.findOne({ student_usn: usn, exit_time: null });
        if (existingEntry) {
            return res.status(400).json({
                error: 'Student is already checked in. Please check out first before checking in again.'
            });
        }

        // Create entry
        const newEntry = new LibraryEntry({
            student_usn: usn,
            semester: student.semester
        });
        await newEntry.save();

        // ✅ Send Welcome Email (if email exists)
        if (student.email) {
            const loginTime = new Date().toLocaleString();
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: student.email,
                subject: `📚 Welcome to the Library, ${student.name}!`,
                html: `
                    <h2>Hello ${student.name},</h2>
                    <p>You have <strong>successfully checked in</strong> to the library.</p>
                    <p><strong>Login Time:</strong> ${loginTime}</p>
                    <p>Enjoy your time! feel free to query anything</p>
                    <br>
                    <p>Regards,<br>Muzammil &Team</p>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('❌ Error sending email:', err.message);
                } else {
                    console.log('✅ Welcome email sent:', info.response);
                }
            });
        }

        // Final Response
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

        // Mark exit time and calculate duration
        entry.exit_time = new Date();
        entry.duration = Math.floor((new Date() - new Date(entry.entry_time)) / 60000); // duration in minutes
        await entry.save();

        // ✅ Send Checkout Email (if email exists)
        const student = await Student.findOne({ usn });
        if (student && student.email) {
            const checkOutTime = new Date().toLocaleString();
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: student.email,
                subject: `📚 You've Checked Out from the Library, ${student.name}!`,
                html: `
                    <h2>Hello ${student.name},</h2>
                    <p>You have <strong>successfully checked out</strong> from the library.</p>
                    <p><strong>Check-out Time:</strong> ${checkOutTime}</p>
                    <p><strong>Duration:</strong> ${entry.duration} minutes</p>
                    <p>We hope you had a productive time!
                    see you next time</p>
                    <br>
                    <p>Regards,<br>Muzammil &Team</p>
                `
            };

            transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    console.error('❌ Error sending email:', err.message);
                } else {
                    console.log('✅ Checkout email sent:', info.response);
                }
            });
        }

        // Final Response
        res.json({
            message: 'Check-out successful',
            duration: `${entry.duration} minutes`
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ➡️ Get all currently checked-in students
router.get('/checked-in', async (req, res) => {
    try {
        const entries = await LibraryEntry.find({ exit_time: null }).populate('student_usn');
        const students = await Promise.all(entries.map(async (entry) => {
            const student = await Student.findOne({ usn: entry.student_usn });
            return student ? { name: student.name, usn: student.usn } : null;
        }));

        res.status(200).json(students.filter(Boolean));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
