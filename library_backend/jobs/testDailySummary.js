const sendDailySummary = require('./dailySummary');
const dotenv = require('dotenv');

dotenv.config();

async function testDailySummary() {
  try {
    console.log('Starting test of daily summary report generation...');
    
    // Get date from command line or use today
    const dateArg = process.argv[2];
    const targetDate = dateArg ? new Date(dateArg) : new Date();
    
    // Get email from command line or use default
    const email = process.argv[3] || process.env.ADMIN_EMAIL;
    
    console.log(`Generating report for: ${targetDate.toDateString()}`);
    console.log(`Will send to email: ${email}`);
    
    // Generate the report and get the path
    const pdfPath = await sendDailySummary({
      email,
      customDate: targetDate,
      returnPath: true
    });
    
    console.log(`✅ Report generated successfully at: ${pdfPath}`);
    console.log('Note: The file will remain on disk since returnPath was set to true');
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing daily summary:', error);
    process.exit(1);
  }
}

// Run the test
testDailySummary(); 