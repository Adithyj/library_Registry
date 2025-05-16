/**
 * This script is a one-time utility to forcibly recreate the admins table
 * and add the required admin users.
 * 
 * Run with: node resetAdminTable.js
 */

const db = require('./db');
const bcrypt = require('bcryptjs');

async function resetAdminTable() {
  try {
    console.log('🔄 Starting admin table reset...');

    // Step 1: Drop existing admins table if it exists
    try {
      await db.query('DROP TABLE IF EXISTS admins CASCADE');
      console.log('✅ Dropped existing admins table (if it existed)');
    } catch (err) {
      console.error('❌ Error dropping admins table:', err.message);
    }

    // Step 2: Create the admins table
    try {
      const createTableSQL = `
        CREATE TABLE admins (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await db.query(createTableSQL);
      console.log('✅ Created new admins table');
    } catch (err) {
      console.error('❌ Error creating admins table:', err.message);
      throw err; // Stop execution if table creation failed
    }

    // Step 3: Add the bharathi admin user
    try {
      const hashedPassword = await bcrypt.hash('librarian_101', 10);
      
      const insertQuery = `
        INSERT INTO admins (username, password, email, name)
        VALUES ($1, $2, $3, $4)
      `;
      
      await db.query(insertQuery, [
        'bharathi', 
        hashedPassword, 
        'bharathi.library@sahyadri.edu.in', 
        'Bharathi Librarian'
      ]);
      
      console.log('✅ Created bharathi admin user');
      
      // Optional: Add a default admin user as well
      const adminHashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.query(insertQuery, [
        'admin', 
        adminHashedPassword, 
        'admin.library@sahyadri.edu.in', 
        'Admin User'
      ]);
      
      console.log('✅ Created default admin user');
    } catch (err) {
      console.error('❌ Error adding admin users:', err.message);
    }

    console.log('✅ Admin table reset completed');
  } catch (error) {
    console.error('❌ Fatal error during admin table reset:', error);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the script
resetAdminTable()
  .then(() => {
    console.log('Reset script completed successfully.');
  })
  .catch(err => {
    console.error('Reset script failed:', err);
    process.exit(1);
  }); 