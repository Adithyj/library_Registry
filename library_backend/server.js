// server.js
const express = require('express');
const cors = require('cors');
require('./db');  // Import database connection
const studentRoutes = require('./routes/students');
const entryRoutes = require('./routes/entries');

const app = express();

// Enable CORS for all origins (you can restrict it to your frontend domain if needed)
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// ➡️ Register Routes
app.use('/students', studentRoutes);  // All /students routes
app.use('/entries', entryRoutes);     // All /entries routes

// ➡️ General Error Handling Middleware (optional)
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log error details
    res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// ➡️ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
