// routes/student.js
const express = require('express');
const router = express.Router();
const Student = require('../model/Student');

// Cache for search queries (lasts 30 seconds)
const searchCache = {
  cache: new Map(),
  maxAge: 30000, // 30 seconds
  set: function(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  },
  get: function(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  },
  clear: function() {
    this.cache.clear();
  }
};

// ➡️ Create a new student
router.post('/', async (req, res) => {
    const { usn, name, department, semester, email, phone } = req.body;
    if (!usn || !name || !department || !semester) {
        return res.status(400).json({ message: 'Missing required fields: usn, name, department, semester' });
    }

    try {
        // Check if student already exists
        const existingStudent = await Student.findByUsn(usn);
        if (existingStudent) {
            return res.status(409).json({ message: 'Student with this USN already exists' });
        }

        const newStudent = await Student.create({ 
            usn: usn.trim().toUpperCase(), 
            name: name.trim(), 
            department: department.trim(), 
            semester: parseInt(semester), 
            email: email?.trim(), 
            phone: phone?.trim() 
        });
        
        // Clear search cache on new student creation
        searchCache.clear();
        
        res.status(201).json({ message: 'Student created successfully', student: newStudent });
    } catch (err) {
        console.error('Error creating student:', err);
        res.status(500).json({ message: 'Error creating student', error: err.message });
    }
});

// ➡️ Get all students
router.get('/', async (req, res) => {
    try {
        const students = await Student.findAll();
        res.status(200).json(students);
    } catch (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ message: 'Error fetching students', error: err.message });
    }
});

// ➡️ Get a student by USN
router.get('/:usn', async (req, res) => {
    try {
        const student = await Student.findByUsn(req.params.usn);
        student ? res.status(200).json(student) : res.status(404).json({ message: 'Student not found' });
    } catch (err) {
        console.error('Error fetching student:', err);
        res.status(500).json({ message: 'Error fetching student', error: err.message });
    }
});

// ➡️ Update a student
router.put('/:usn', async (req, res) => {
    try {
        // Validate and sanitize inputs
        const sanitizedData = {};
        const allowedFields = ['name', 'department', 'semester', 'email', 'phone'];
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                sanitizedData[field] = typeof req.body[field] === 'string' 
                    ? req.body[field].trim() 
                    : req.body[field];
            }
        }

        const updatedStudent = await Student.update(req.params.usn, sanitizedData);
        
        if (updatedStudent) {
            // Clear search cache on student update
            searchCache.clear();
            res.status(200).json(updatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (err) {
        console.error('Error updating student:', err);
        res.status(500).json({ message: 'Error updating student', error: err.message });
    }
});

// ➡️ Delete a student
router.delete('/:usn', async (req, res) => {
    try {
        const deletedStudent = await Student.delete(req.params.usn);
        
        if (deletedStudent) {
            // Clear search cache on student deletion
            searchCache.clear();
            res.status(200).json(deletedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (err) {
        if (err.message.includes('active library entries')) {
            return res.status(400).json({ message: err.message });
        }
        console.error('Error deleting student:', err);
        res.status(500).json({ message: 'Error deleting student', error: err.message });
    }
});

// ➡️ Search for students by USN (for auto-suggest feature)
router.get('/search/:query', async (req, res) => {
    const query = req.params.query.toLowerCase();
    
    try {
        // First check the cache
        const cachedResults = searchCache.get(query);
        if (cachedResults) {
            console.log(`Cache hit for search: ${query}`);
            return res.status(200).json(cachedResults);
        }
        
        console.log(`Cache miss for search: ${query}`);
        
        // Set a timeout for the operation
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Search operation timed out')), 2000);
        });
        
        // Race between the actual search and the timeout
        const students = await Promise.race([
            Student.search(query),
            timeoutPromise
        ]);
        
        // Cache the results
        searchCache.set(query, students || []);
        
        res.status(200).json(students || []);
    } catch (error) {
        console.error('Search operation failed:', error.message);
        
        // Return empty results instead of an error
        // This approach prioritizes UI responsiveness over error reporting
        res.status(200).json([]);
    }
});

module.exports = router;
