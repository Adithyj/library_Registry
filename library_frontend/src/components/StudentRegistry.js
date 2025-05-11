import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentRegistry.css';

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
  const navigate = useNavigate();

  // Handle form data change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await axios.post('http://localhost:5000/students', formData); // No need to store the response
      setMessage('Student registered successfully! Redirecting to Check In...');
      setTimeout(() => {
        navigate('/check-in');
      }, 2000); // Redirect after 2 seconds
    } catch (error) {
      setMessage(error.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <h2 className="text-xl mb-3">Student Registry</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="usn"
          placeholder="Enter USN"
          value={formData.usn}
          onChange={handleChange}
          required
          className="border p-2 mb-3 w-full"
        />
        <input
          type="text"
          name="name"
          placeholder="Enter Name"
          value={formData.name}
          onChange={handleChange}
          required
          className="border p-2 mb-3 w-full"
        />
        <input
          type="text"
          name="department"
          placeholder="Enter Department"
          value={formData.department}
          onChange={handleChange}
          required
          className="border p-2 mb-3 w-full"
        />
        <input
          type="number"
          name="semester"
          placeholder="Enter Semester"
          value={formData.semester}
          onChange={handleChange}
          required
          className="border p-2 mb-3 w-full"
        />
        <input
          type="email"
          name="email"
          placeholder="Enter Email (optional)"
          value={formData.email}
          onChange={handleChange}
          className="border p-2 mb-3 w-full"
        />
        <input
          type="text"
          name="phone"
          placeholder="Enter Phone (optional)"
          value={formData.phone}
          onChange={handleChange}
          className="border p-2 mb-3 w-full"
        />
        <button
          type="submit"
          className={`p-2 bg-green-500 text-white w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      {message && <p className="mt-3 text-green-500">{message}</p>}
    </div>
  );
};

export default StudentRegistry;
