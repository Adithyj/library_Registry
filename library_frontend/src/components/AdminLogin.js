// src/components/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminLogin.css';

function AdminLogin() {
  // State for form inputs and validation
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize navigate for redirection
  const navigate = useNavigate();

  // Email validation function for the specific format
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.]+\.library@sahyadri\.edu\.in$/;
    return emailRegex.test(email);
  };

  // Handle login form submission
  const handleLogin = (e) => {
    e.preventDefault();
    
    // Reset error state
    setError('');
    
    // Validate email format
    if (!validateEmail(email)) {
      setError('Please enter a valid email in format: name.library@sahyadri.edu.in');
      return;
    }
    
    // Validate password is not empty
    if (!password) {
      setError('Password is required');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    // Simulate authentication API call
    // In production, replace with actual API call to your backend
    setTimeout(() => {
      // Reset loading state
      setIsLoading(false);
      
      // For demo purposes, log the attempt
      console.log('Login attempt with:', { email, password });
      
      // Navigate to admin dashboard after successful login
      navigate('/admin-dashboard');
      
    }, 1500); // Simulating network request delay
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/title-logo.png" alt="Sahyadri Library" className="admin-login-logo" />
          <h1>Sahyadri College Library</h1>
          <h2>Admin Portal</h2>
        </div>
        
        <form className="admin-login-form" onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name.library@sahyadri.edu.in"
              className="admin-form-input"
            />
          </div>
          
          <div className="admin-form-group">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-form-input"
            />
          </div>

          {error && <div className="admin-error-message">{error}</div>}

          <div className="admin-form-options">
            <div className="admin-remember-me">
              <input
                id="admin-remember-me"
                type="checkbox"
                className="admin-checkbox"
              />
              <label htmlFor="admin-remember-me">Remember me</label>
            </div>

            <a href="#" className="admin-forgot-password">Forgot your password?</a>
          </div>

          <button 
            type="submit" 
            className={`admin-login-button ${isLoading ? 'admin-loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <div className="admin-divider">
            <span>Admin Access Only</span>
          </div>
          <p className="admin-copyright">
            This portal is restricted to authorized library staff only.
            <br />
            Sahyadri College © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;