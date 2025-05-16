-- PostgreSQL schema for library system

-- Students table
CREATE TABLE students (
  usn VARCHAR(20) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  semester INTEGER NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(15),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Library entries table
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

-- Admins table
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO students (usn, name, department, semester, email, phone)
VALUES 
  ('1RV20CS001', 'Rahul Sharma', 'CSE', 3, 'rahul@college.edu', '9876543210'),
  ('1RV20EC002', 'Priya Patel', 'ECE', 4, 'priya@college.edu', '8765432109'),
  ('1RV20ME003', 'Amit Kumar', 'MECH', 2, 'amit@college.edu', '7654321098');

-- Default admin users
-- Password hashes:
-- 'admin123' for admin and muzammil
-- 'librarian_101' for bharathi
INSERT INTO admins (username, password, email, name)
VALUES 
  ('admin', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'admin.library@sahyadri.edu.in', 'Admin User'),
  ('muzammil', '$2a$10$mLK.rrdlvx9DCFb6Eck1t.TlltnGulepXnov3bBp5T2TloO1MYj52', 'muzammil.library@sahyadri.edu.in', 'Muzammil Admin'),
  ('bharathi', '$2a$10$tJP3EdjAXcbQkPVQsKCyJunMCIqYGU5U/4BvqQCMYLlARzrNh/R/q', 'bharathi.library@sahyadri.edu.in', 'Bharathi Librarian');