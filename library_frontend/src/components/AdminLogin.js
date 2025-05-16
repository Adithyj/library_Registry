// src/components/AdminLogin.js
import React, { useState, useEffect } from 'react';
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
  
  // Check if already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token before redirecting
      fetch('http://localhost:5000/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          navigate('/admin-dashboard');
        } else {
          // If token is invalid, remove it
          localStorage.removeItem('adminToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
      });
    }
  }, [navigate]);

  // Email validation function for the specific format
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9.]+\.library@sahyadri\.edu\.in$/;
    return emailRegex.test(email);
  };

  // Handle login form submission
  const handleLogin = async (e) => {
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
    
    try {
      // Make API call to backend for authentication
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      // Check content type before parsing as JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Not a JSON response
        throw new Error('Server returned an invalid response. Please check if the backend is running.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }
      
      // If login successful, store token and redirect
      localStorage.setItem('adminToken', data.token);
      
      // Navigate to admin dashboard
      navigate('/admin-dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. The server may be down or unreachable.');
    } finally {
      setIsLoading(false);
    }
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

            <button 
              type="button" 
              className="admin-forgot-password" 
              onClick={() => alert("Contact your administrator to reset your password.")}
            >
              Forgot your password?
            </button>
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