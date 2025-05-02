-- Create database
CREATE DATABASE IF NOT EXISTS library_system;
USE library_system;

-- Students table
CREATE TABLE students (
  usn VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  semester INT NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library entries table
CREATE TABLE library_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_usn VARCHAR(20) NOT NULL,
  book_number VARCHAR(50) NULL COMMENT 'Optional book identifier',
  entry_time DATETIME NOT NULL,
  exit_time DATETIME,
  duration INT COMMENT 'In minutes',
  semester INT NOT NULL COMMENT 'Semester when entry was made',
  FOREIGN KEY (student_usn) REFERENCES students(usn)
);

-- Sample data
INSERT INTO students (usn, name, department, semester, email, phone)
VALUES 
  ('1RV20CS001', 'Rahul Sharma', 'CSE', 3, 'rahul@college.edu', '9876543210'),
  ('1RV20EC002', 'Priya Patel', 'ECE', 4, 'priya@college.edu', '8765432109'),
  ('1RV20ME003', 'Amit Kumar', 'MECH', 2, 'amit@college.edu', '7654321098');