import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentRegistry.css';

// Create axios instance with timeout
const api = axios.create({
  timeout: 5000 // 5 seconds timeout
});

const StudentRegistry = () => {
  const [formData, setFormData] = useState({
    usn: '',
    name: '',
    department: '',
    semester: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Input validation
  const validateForm = () => {
    const newErrors = {};
    
    // USN validation - typically format like "1XX21XX000"
    if (!formData.usn.trim()) {
      newErrors.usn = 'USN is required';
    } else if (formData.usn.length < 3) {
      newErrors.usn = 'USN is too short';
    }
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Department validation
    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    // Semester validation
    if (!formData.semester) {
      newErrors.semester = 'Semester is required';
    } else if (formData.semester < 1 || formData.semester > 8) {
      newErrors.semester = 'Semester must be between 1 and 8';
    }
    
    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation (optional)
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  // Handle form data change
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
    
    setFormData({...formData, [name]: value});
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');

    try {
      // Trim all string values to remove whitespace
      const trimmedData = Object.keys(formData).reduce((obj, key) => {
        obj[key] = typeof formData[key] === 'string' ? formData[key].trim() : formData[key];
        return obj;
      }, {});
      
      await api.post('http://localhost:5000/api/students', trimmedData);
      
      setMessage('Student registered successfully! Redirecting to Check In...');
      
      // Reset form
      setFormData({
        usn: '',
        name: '',
        department: '',
        semester: '',
        email: '',
        phone: '',
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/check-in');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.request) {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to show field error message
  const getErrorClass = (fieldName) => {
    return errors[fieldName] ? 'border-red-500' : '';
  };

  return (
    <div className="p-5">
      {/* Logo Section */}
      <div className="logo-container">
        <img src="title-logo.png" alt="Logo" className="logo" />
      </div>

      {/* Title Section */}
      <h2 className="text-xl mb-3">Student Registry</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <input
            type="text"
            name="usn"
            placeholder="Enter USN"
            value={formData.usn}
            onChange={handleChange}
            required
            className={`border p-2 w-full ${getErrorClass('usn')}`}
          />
          {errors.usn && <p className="text-red-500 text-xs mt-1">{errors.usn}</p>}
        </div>
        
        <div className="mb-3">
          <input
            type="text"
            name="name"
            placeholder="Enter Name"
            value={formData.name}
            onChange={handleChange}
            required
            className={`border p-2 w-full ${getErrorClass('name')}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        <div className="mb-3">
          <input
            type="text"
            name="department"
            placeholder="Enter Department"
            value={formData.department}
            onChange={handleChange}
            required
            className={`border p-2 w-full ${getErrorClass('department')}`}
          />
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
        </div>
        
        <div className="mb-3">
          <input
            type="number"
            name="semester"
            placeholder="Enter Semester"
            value={formData.semester}
            onChange={handleChange}
            required
            min="1"
            max="8"
            className={`border p-2 w-full ${getErrorClass('semester')}`}
          />
          {errors.semester && <p className="text-red-500 text-xs mt-1">{errors.semester}</p>}
        </div>
        
        <div className="mb-3">
          <input
            type="email"
            name="email"
            placeholder="Enter Email (optional)"
            value={formData.email}
            onChange={handleChange}
            className={`border p-2 w-full ${getErrorClass('email')}`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>
        
        <div className="mb-3">
          <input
            type="text"
            name="phone"
            placeholder="Enter Phone (optional)"
            value={formData.phone}
            onChange={handleChange}
            className={`border p-2 w-full ${getErrorClass('phone')}`}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
        
        <button
          type="submit"
          className={`p-2 bg-green-500 text-white w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      {/* Message */}
      {message && (
        <p className={`mt-3 ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default StudentRegistry;
