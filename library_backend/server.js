const express = require('express');
const app = express();


// Middleware
app.use(express.json());

// Routes

app.use('/api/entries', require('./routes/entries'));
app.use('/api/students', require('./routes/students'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));