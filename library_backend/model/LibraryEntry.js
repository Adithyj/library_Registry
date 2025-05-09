const mongoose = require('mongoose');

const LibraryEntrySchema = new mongoose.Schema({
    student_usn: { type: String, required: true },
    book_number: { type: String, default: null },
    entry_time: { type: Date, default: Date.now },
    exit_time: { type: Date, default: null },
    duration: { type: Number, default: 0 },
    semester: { type: Number }
});

module.exports = mongoose.model('LibraryEntry', LibraryEntrySchema);
