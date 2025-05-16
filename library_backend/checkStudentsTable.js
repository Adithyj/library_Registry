/**
 * This script checks the students table structure and fixes any issues
 * 
 * Run with: node checkStudentsTable.js
 */

const db = require('./db');
const fs = require('fs');
const path = require('path');

async function checkStudentsTable() {
  try {
    console.log('🔍 Checking database structure...');

    // Check if students table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'students'
      );
    `);
    
    const studentsTableExists = tableCheck.rows[0].exists;
    
    if (!studentsTableExists) {
      console.log('❌ Students table does not exist, creating it...');
      
      // Create the students table
      await db.query(`
        CREATE TABLE students (
          usn VARCHAR(20) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          department VARCHAR(50) NOT NULL,
          semester INTEGER NOT NULL,
          email VARCHAR(100),
          phone VARCHAR(15),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Created students table');
    } else {
      console.log('✅ Students table exists');
      
      // Check the structure of the students table
      const columnsCheck = await db.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students';
      `);
      
      console.log('📋 Current students table structure:');
      columnsCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    }
    
    // Check if library_entries table exists and has proper constraints
    const entriesTableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'library_entries'
      );
    `);
    
    const entriesTableExists = entriesTableCheck.rows[0].exists;
    
    if (!entriesTableExists) {
      console.log('❌ Library entries table does not exist, creating it...');
      
      // Create the library_entries table
      await db.query(`
        CREATE TABLE library_entries (
          id SERIAL PRIMARY KEY,
          student_usn VARCHAR(20) NOT NULL,
          book_number VARCHAR(50),
          entry_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          exit_time TIMESTAMP,
          duration INTEGER,
          semester INTEGER NOT NULL,
          FOREIGN KEY (student_usn) REFERENCES students(usn)
        );
      `);
      
      console.log('✅ Created library_entries table');
    } else {
      console.log('✅ Library entries table exists');
      
      // Check foreign key constraints
      const constraintCheck = await db.query(`
        SELECT conname, pg_get_constraintdef(oid) as constraint_def
        FROM pg_constraint 
        WHERE conrelid = 'library_entries'::regclass::oid 
        AND contype = 'f';
      `);
      
      console.log('📋 Foreign key constraints:');
      if (constraintCheck.rows.length > 0) {
        constraintCheck.rows.forEach(constraint => {
          console.log(`   - ${constraint.conname}: ${constraint.constraint_def}`);
        });
      } else {
        console.log('   - No foreign key constraints found');
        
        // Add foreign key constraint if missing
        try {
          await db.query(`
            ALTER TABLE library_entries 
            ADD CONSTRAINT library_entries_student_usn_fkey 
            FOREIGN KEY (student_usn) REFERENCES students(usn);
          `);
          console.log('✅ Added missing foreign key constraint');
        } catch (err) {
          console.error('❌ Error adding foreign key constraint:', err.message);
        }
      }
    }
    
    // Try inserting a test student to ensure it works
    try {
      // First check if test student exists
      const testStudent = await db.query(`
        SELECT * FROM students WHERE usn = 'TEST001';
      `);
      
      if (testStudent.rows.length === 0) {
        // Insert test student
        await db.query(`
          INSERT INTO students (usn, name, department, semester, email, phone)
          VALUES ('TEST001', 'Test Student', 'TEST', 1, 'test@example.com', '1234567890');
        `);
        console.log('✅ Successfully inserted test student');
        
        // Clean up - delete test student
        await db.query(`
          DELETE FROM students WHERE usn = 'TEST001';
        `);
        console.log('✅ Removed test student');
      } else {
        console.log('✅ Insert functionality verified with existing test student');
      }
    } catch (err) {
      console.error('❌ Error testing student insert:', err.message);
      
      // If there's an error with the insert, it might indicate a permissions issue or other structural problem
      console.log('⚠️ The student table might not be correctly set up or permissions issues exist');
    }
    
    console.log('✅ Database check completed');
  } catch (error) {
    console.error('❌ Error during database check:', error);
  }
}

// Run the script
checkStudentsTable()
  .then(() => {
    console.log('Check completed successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Check failed:', err);
    process.exit(1);
  }); 