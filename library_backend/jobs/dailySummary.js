const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const LibraryEntry = require('../model/LibraryEntry');
const Student = require('../model/Student');
const transporter = require('../utils/mailer');
const dotenv = require('dotenv');

dotenv.config();

async function sendDailySummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const entries = await LibraryEntry.find({
            entry_time: { $gte: today, $lt: tomorrow }
        });

        const students = await Promise.all(entries.map(async entry => {
            const student = await Student.findOne({ usn: entry.student_usn });
            return student
                ? { name: student.name, department: student.department, usn: student.usn }
                : null;
        }));

        const filtered = students.filter(Boolean);

        // ✅ Generate PDF
        const doc = new PDFDocument();
        const pdfPath = path.join(__dirname, 'Daily_Summary.pdf');
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Heading
        doc.fontSize(20).text('📚 Daily Library Summary', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Date: ${today.toDateString()}`);
        doc.moveDown();

        // Table header
        doc.fontSize(12).text('Name', 50, doc.y, { width: 150 });
        doc.text('Department', 200, doc.y, { width: 150 });
        doc.text('USN', 350, doc.y);
        doc.moveDown();

        // Table content
        filtered.forEach(student => {
            doc.text(student.name, 50, doc.y, { width: 150 });
            doc.text(student.department, 200, doc.y, { width: 150 });
            doc.text(student.usn, 350, doc.y);
            doc.moveDown();
        });

        doc.end();

        // Wait for PDF to finish writing
        writeStream.on('finish', async () => {
            // Send email with PDF attached
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: process.env.ADMIN_EMAIL,
                subject: `📚 Daily Library Report - ${today.toDateString()}`,
                text: `Attached is the library summary report for ${today.toDateString()}.`,
                attachments: [
                    {
                        filename: 'Daily_Summary.pdf',
                        path: pdfPath,
                        contentType: 'application/pdf'
                    }
                ]
            });

            console.log("✅ Daily summary email with PDF sent.");
            fs.unlinkSync(pdfPath); // delete temp PDF after sending
        });

    } catch (err) {
        console.error("❌ Error sending daily summary:", err.message);
    }
}

module.exports = sendDailySummary;
