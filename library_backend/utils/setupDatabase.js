const db = require('../db');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  try {
    console.log('🔄 Setting up database...');
    
    // Use a single transaction for table checks to reduce connection overhead
    await db.withTransaction(async (client) => {
      // Check if students table exists
      const studentsTableCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'students'
        );
      `);
      
      const studentsTableExists = studentsTableCheck.rows[0].exists;
      
      if (!studentsTableExists) {
        // Only create all tables if students table doesn't exist
        console.log('Creating all tables including students...');
        const schemaPath = path.join(__dirname, '../database.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('✅ All database tables created successfully');
      } else {
        console.log('✅ Students table already exists');
        
        // Separately check if admins table exists
        const adminsTableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'admins'
          );
        `);
        
        const adminsTableExists = adminsTableCheck.rows[0].exists;
        
        if (!adminsTableExists) {
          console.log('Creating admins table...');
          // Create just the admins table
          const adminsTableSQL = `
            CREATE TABLE admins (
              id SERIAL PRIMARY KEY,
              username VARCHAR(50) NOT NULL UNIQUE,
              password VARCHAR(100) NOT NULL,
              email VARCHAR(100) NOT NULL UNIQUE,
              name VARCHAR(100) NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
          `;
          await client.query(adminsTableSQL);
          console.log('✅ Admins table created successfully');
        } else {
          console.log('✅ Admins table already exists');
        }
      }
      
      // Check if bharathi admin already exists (in the same transaction)
      const checkAdminQuery = 'SELECT * FROM admins WHERE email = $1';
      const adminResult = await client.query(checkAdminQuery, ['bharathi.library@sahyadri.edu.in']);
      
      if (adminResult.rows.length === 0) {
        // Create the admin if it doesn't exist
        const hashedPassword = await bcrypt.hash('librarian_101', 10);
        
        const insertQuery = `
          INSERT INTO admins (username, password, email, name)
          VALUES ($1, $2, $3, $4)
        `;
        
        await client.query(insertQuery, [
          'bharathi', 
          hashedPassword, 
          'bharathi.library@sahyadri.edu.in', 
          'Bharathi Librarian'
        ]);
        
        console.log('✅ Created bharathi admin user');
      } else {
        console.log('✅ bharathi admin user already exists');
      }
    });
    
    console.log('✅ Database setup completed');
    
  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error; // Rethrow to handle in the caller
  }
}

// Run if called directly (node setupDatabase.js)
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('Setup complete. You can now start the server.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Setup failed:', err);
      process.exit(1);
    });
} else {
  // Export for use in other files
  module.exports = setupDatabase;
} 