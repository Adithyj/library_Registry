const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Admin model for PostgreSQL
 */
class Admin {
  // Find admin by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM admins WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0] || null;
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Generate JWT token
  static generateToken(adminId, username) {
    const token = jwt.sign(
      { id: adminId, username: username, role: 'admin' },
      process.env.JWT_SECRET || 'library_secret_key',
      { expiresIn: '24h' }
    );
    return token;
  }

  // Create a new admin (for initial setup)
  static async create(adminData) {
    const { username, password, email, name } = adminData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO admins (username, password, email, name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, name
    `;
    const values = [username, hashedPassword, email, name];
    const result = await db.query(query, values);
    return result.rows[0];
  }
}

module.exports = Admin; 