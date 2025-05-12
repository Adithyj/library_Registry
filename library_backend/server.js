const express = require('express');
const cors = require('cors');
require('./db');  // Database connection
const studentRoutes = require('./routes/students');
const entryRoutes = require('./routes/entries');
const cron = require('node-cron');
const sendDailySummary = require('./jobs/dailySummary'); // Only import it once

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/students', studentRoutes);
app.use('/entries', entryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong', error: err.message });
});

// Temporary testing route for daily summary (No need to re-import here)
app.get('/test-summary', async (req, res) => {
  console.log('Test summary route hit');  // Add this log
  try {
    await sendDailySummary();
    res.send('📧 Summary sent successfully!');
  } catch (err) {
    console.error('❌ Summary sending failed:', err.message);
    res.status(500).send('❌ Failed to send summary.');
  }
});


// Server listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
