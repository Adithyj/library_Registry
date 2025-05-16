const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const db = require('../db');
const transporter = require('../utils/mailer');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Generate and send a daily summary report of library usage
 * @param {Object} options - Configuration options
 * @param {string} options.email - Email to send the report to (optional)
 * @param {Date} options.customDate - Custom date for the report (defaults to today)
 * @param {boolean} options.returnPath - Whether to return the path to the generated PDF
 * @returns {Promise<string>} - Path to the generated PDF if returnPath is true
 */
async function sendDailySummary(options = {}) {
    // Default options
    const { 
        email = process.env.ADMIN_EMAIL, 
        customDate = new Date(),
        returnPath = false
    } = options;
    
    // Set date range for the query
    const targetDate = new Date(customDate);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Format dates for PostgreSQL query
    const startDateStr = targetDate.toISOString();
    const endDateStr = nextDay.toISOString();

    try {
        // Get entries for the specified date using PostgreSQL
        const entriesQuery = `
            SELECT le.*, s.name, s.department, s.semester
            FROM library_entries le
            JOIN students s ON le.student_usn = s.usn
            WHERE le.entry_time >= $1 AND le.entry_time < $2
            ORDER BY le.entry_time ASC
        `;
        
        const entriesResult = await db.query(entriesQuery, [startDateStr, endDateStr]);
        const entries = entriesResult.rows;
        
        // Get statistics
        const statsQuery = `
            SELECT 
                COUNT(*) as total_entries,
                COUNT(CASE WHEN exit_time IS NULL THEN 1 END) as active_entries,
                COUNT(CASE WHEN exit_time IS NOT NULL THEN 1 END) as completed_entries,
                AVG(CASE WHEN duration IS NOT NULL THEN duration END) as avg_duration
            FROM library_entries
            WHERE entry_time >= $1 AND entry_time < $2
        `;
        
        const statsResult = await db.query(statsQuery, [startDateStr, endDateStr]);
        const stats = statsResult.rows[0];
        
        // Get department breakdown
        const deptQuery = `
            SELECT s.department, COUNT(*) as count
            FROM library_entries le
            JOIN students s ON le.student_usn = s.usn
            WHERE le.entry_time >= $1 AND le.entry_time < $2
            GROUP BY s.department
            ORDER BY count DESC
        `;
        
        const deptResult = await db.query(deptQuery, [startDateStr, endDateStr]);
        const deptBreakdown = deptResult.rows;
        
        // Get semester breakdown
        const semesterQuery = `
            SELECT s.semester, COUNT(*) as count
            FROM library_entries le
            JOIN students s ON le.student_usn = s.usn
            WHERE le.entry_time >= $1 AND le.entry_time < $2
            GROUP BY s.semester
            ORDER BY s.semester ASC
        `;
        
        const semesterResult = await db.query(semesterQuery, [startDateStr, endDateStr]);
        const semesterBreakdown = semesterResult.rows;
        
        // Calculate peak hours
        const hourlyQuery = `
            SELECT EXTRACT(HOUR FROM entry_time) as hour, COUNT(*) as count
            FROM library_entries
            WHERE entry_time >= $1 AND entry_time < $2
            GROUP BY EXTRACT(HOUR FROM entry_time)
            ORDER BY count DESC
            LIMIT 1
        `;
        
        const hourlyResult = await db.query(hourlyQuery, [startDateStr, endDateStr]);
        const peakHour = hourlyResult.rows[0] || { hour: 'N/A', count: 0 };

        // ✅ Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const pdfFileName = `Library_Summary_${targetDate.toISOString().split('T')[0]}.pdf`;
        const pdfPath = path.join(__dirname, pdfFileName);
        const writeStream = fs.createWriteStream(pdfPath);
        doc.pipe(writeStream);

        // Add header with college logo and title
        doc.fontSize(22).text('Sahyadri College Library', { align: 'center' });
        doc.fontSize(18).text('Daily Summary Report', { align: 'center' });
        doc.moveDown();
        
        // Add date
        doc.fontSize(14).text(`Date: ${targetDate.toDateString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Add summary statistics
        doc.fontSize(16).text('Summary Statistics', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12);
        doc.text(`Total Entries: ${stats.total_entries || 0}`);
        doc.text(`Active/Current Entries: ${stats.active_entries || 0}`);
        doc.text(`Completed Entries: ${stats.completed_entries || 0}`);
        doc.text(`Average Duration: ${stats.avg_duration ? Math.round(stats.avg_duration) + ' minutes' : 'N/A'}`);
        doc.text(`Peak Hour: ${peakHour.hour !== 'N/A' ? `${peakHour.hour}:00 - ${peakHour.hour}:59 (${peakHour.count} entries)` : 'N/A'}`);
        doc.moveDown(2);
        
        // Add department breakdown
        if (deptBreakdown.length > 0) {
            doc.fontSize(16).text('Department Breakdown', { underline: true });
            doc.moveDown();
            
            deptBreakdown.forEach(dept => {
                doc.fontSize(12).text(`${dept.department}: ${dept.count} entries`);
            });
            doc.moveDown(2);
        }
        
        // Add semester breakdown
        if (semesterBreakdown.length > 0) {
            doc.fontSize(16).text('Semester Breakdown', { underline: true });
            doc.moveDown();
            
            semesterBreakdown.forEach(semester => {
                doc.fontSize(12).text(`Semester ${semester.semester}: ${semester.count} entries`);
            });
            doc.moveDown(2);
        }
        
        // Add detailed entries
        doc.fontSize(16).text('Detailed Entries', { underline: true });
        doc.moveDown();
        
        // Create table header
        const tableTop = doc.y;
        const tableLeft = 50;
        const colWidths = [120, 80, 80, 80, 80];
        
        // Draw header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Student Name', tableLeft, tableTop);
        doc.text('USN', tableLeft + colWidths[0], tableTop);
        doc.text('Department', tableLeft + colWidths[0] + colWidths[1], tableTop);
        doc.text('Check In', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop);
        doc.text('Check Out', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);
        
        doc.font('Helvetica');
        let tableY = tableTop + 20;
        
        // Add table content with alternating background
        entries.forEach((entry, i) => {
            // Check if we need a new page
            if (tableY > doc.page.height - 100) {
                doc.addPage();
                tableY = 50;
            }
            
            // Draw alternating background
            if (i % 2 === 0) {
                doc.rect(tableLeft - 5, tableY - 5, 
                    colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + 10, 
                    20).fill('#f5f5f5');
            }
            
            // Draw text
            doc.fillColor('black');
            doc.text(entry.name || 'N/A', tableLeft, tableY);
            doc.text(entry.student_usn, tableLeft + colWidths[0], tableY);
            doc.text(entry.department || 'N/A', tableLeft + colWidths[0] + colWidths[1], tableY);
            
            // Format dates
            const checkInTime = new Date(entry.entry_time).toLocaleTimeString();
            const checkOutTime = entry.exit_time ? new Date(entry.exit_time).toLocaleTimeString() : 'Still Active';
            
            doc.text(checkInTime, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableY);
            doc.text(checkOutTime, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableY);
            
            tableY += 20;
        });
        
        // Add footer
        const pageCount = doc.bufferedPageRange().count;
        for (let i = 0; i < pageCount; i++) {
            doc.switchToPage(i);
            
            // Add page number
            doc.fontSize(8).text(
                `Page ${i + 1} of ${pageCount}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
            
            // Add footer text
            doc.fontSize(8).text(
                `Generated on ${new Date().toLocaleString()} | Sahyadri College Library Management System`,
                50,
                doc.page.height - 35,
                { align: 'center' }
            );
        }
        
        doc.end();

        // Wait for PDF to finish writing
        return new Promise((resolve, reject) => {
            writeStream.on('finish', async () => {
                if (email) {
                    // Send email with PDF attached
                    try {
                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: email,
                            subject: `📚 Library Report - ${targetDate.toDateString()}`,
                            html: `
                                <h2>Library Usage Report</h2>
                                <p>Attached is the library summary report for ${targetDate.toDateString()}.</p>
                                <p><strong>Summary:</strong></p>
                                <ul>
                                    <li>Total Entries: ${stats.total_entries || 0}</li>
                                    <li>Active Entries: ${stats.active_entries || 0}</li>
                                    <li>Completed Entries: ${stats.completed_entries || 0}</li>
                                    <li>Average Duration: ${stats.avg_duration ? Math.round(stats.avg_duration) + ' minutes' : 'N/A'}</li>
                                </ul>
                                <p>For complete details, please see the attached PDF report.</p>
                                <p>Regards,<br>Library Management System</p>
                            `,
                            attachments: [
                                {
                                    filename: pdfFileName,
                                    path: pdfPath,
                                    contentType: 'application/pdf'
                                }
                            ]
                        });
                        console.log(`✅ Summary report for ${targetDate.toDateString()} emailed to ${email}`);
                    } catch (emailErr) {
                        console.error("❌ Error sending email:", emailErr.message);
                    }
                }
                
                if (!returnPath) {
                    // Clean up the file if we don't need to return the path
                    fs.unlinkSync(pdfPath);
                    resolve(null);
                } else {
                    resolve(pdfPath);
                }
            });
            
            writeStream.on('error', (err) => {
                reject(err);
            });
        });
    } catch (err) {
        console.error("❌ Error generating daily summary:", err.message);
        throw err;
    }
}

module.exports = sendDailySummary;
