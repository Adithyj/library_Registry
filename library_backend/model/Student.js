

const mongoose = require('mongoose');

// Define the student schema
const studentSchema = new mongoose.Schema({
  usn: {
    type: String,
    required: true,  // Field is required
    unique: true,    // Ensures unique USN
  },
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  semester: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  phone: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now  // Automatically sets the current timestamp
  }
});

// Create a model from the schema
const Student = mongoose.model('Student', studentSchema);

// Export the model to use it in other parts of the application
module.exports = Student;
