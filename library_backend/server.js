const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./model/Student');  // Import your model

const app = express();
app.use(express.json());  // Middleware to parse JSON request bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('🌐 MongoDB Connected Successfully!');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// Create a new student through the API
app.post('/students', async (req, res) => {
  const { usn, name, department, semester, email, phone } = req.body;
  
  // Check if the required fields are present
  if (!usn || !name || !department || !semester) {
    return res.status(400).json({ message: 'Missing required fields: usn, name, department, semester' });
  }

  try {
    // Create a new student and save it to MongoDB
    const newStudent = new Student({
      usn,
      name,
      department,
      semester,
      email,
      phone
    });

    // Save student to the database
    await newStudent.save();
    res.status(201).json({ message: 'Student created successfully', student: newStudent });
  } catch (err) {
    res.status(500).json({ message: 'Error creating student', error: err.message });
  }
});

// Get all students from the database
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();  // Retrieve all students
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students', error: err.message });
  }
});

// Get a specific student by USN
app.get('/students/:usn', async (req, res) => {
  const { usn } = req.params;

  try {
    const student = await Student.findOne({ usn });  // Find student by USN
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching student', error: err.message });
  }
});

// Update a student's information
app.put('/students/:usn', async (req, res) => {
  const { usn } = req.params;
  const updateData = req.body;

  try {
    const updatedStudent = await Student.findOneAndUpdate({ usn }, updateData, { new: true });  // Find and update
    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (err) {
    res.status(500).json({ message: 'Error updating student', error: err.message });
  }
});

// Delete a student from the database
app.delete('/students/:usn', async (req, res) => {
  const { usn } = req.params;

  try {
    const deletedStudent = await Student.findOneAndDelete({ usn });  // Find and delete
    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json({ message: 'Student deleted successfully', student: deletedStudent });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting student', error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
