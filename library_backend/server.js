// server.js
const express = require('express');
const cors = require('cors');
require('./db');  // Import database connection
const studentRoutes = require('./routes/students');
const entryRoutes = require('./routes/entries');

const app = express();
app.use(express.json());
// Enable CORS for all origins (you can restrict it to your frontend domain if needed)
app.use(cors());
// ➡️ Register Routes
app.use('/students', studentRoutes);  // All /students routes
app.use('/entries', entryRoutes);     // All /entries routes

// ➡️ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
