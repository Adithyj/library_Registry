const cron = require('node-cron');
const sendDailySummary = require('./dailySummary');
const dotenv = require('dotenv');

dotenv.config();

console.log('🕒 Starting daily summary scheduler...');

// Schedule task to run at midnight (00:00) every day
cron.schedule('0 0 * * *', async () => {
  try {
    console.log(`📊 Running daily summary job at ${new Date().toLocaleString()}...`);
    
    // Use yesterday's date for the report
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Send the report to the admin email from .env
    await sendDailySummary({
      customDate: yesterday
    });
    
    console.log('✅ Daily summary job completed successfully');
  } catch (error) {
    console.error('❌ Error running scheduled daily summary:', error);
  }
});

console.log('✅ Daily summary scheduler started. Reports will be generated at midnight.'); 