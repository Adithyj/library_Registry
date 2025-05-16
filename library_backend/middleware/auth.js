const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * JWT Authentication middleware for protected routes
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided or invalid format' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided'
      });
    }
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'library_secret_key');
      
      // Add user data to request
      req.user = decoded;
      
      // Check if user is admin
      if (decoded.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin privileges required' 
        });
      }
      
      // Proceed to the next middleware/route handler
      next();
    } catch (jwtError) {
      // Handle specific JWT verification errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired. Please login again.' 
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token. Please login again.' 
        });
      } else {
        throw jwtError; // Let the main try/catch handle unexpected errors
      }
    }
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication' 
    });
  }
};

// This is a placeholder middleware that allows all requests to pass through
// We use the specific authenticateAdmin middleware for protected routes
module.exports = (req, res, next) => {
  next();
}; 