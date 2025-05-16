import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './checkin.css';

// Debounce function to limit API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CheckIn = () => {
  const [usn, setUsn] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  
  // Create axios instance with timeout
  const api = axios.create({
    timeout: 5000 // 5 seconds timeout
  });

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        try {
          const response = await api.get(`http://localhost:5000/api/students/search/${searchTerm}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          // Don't show error to user for search suggestions
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300), // 300ms debounce
    []
  );

  // Effect for searching
  useEffect(() => {
    debouncedSearch(usn);
    
    // Cleanup function
    return () => {
      // Cancel any pending debounced calls when component unmounts
    };
  }, [usn, debouncedSearch]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!usn.trim()) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('http://localhost:5000/api/entries/check-in', {
        usn: usn.trim()
      });

      if (response.data.message.includes('not found')) {
        setMessage('Student not found. You can register below.');
      } else {
        setMessage('Check-in successful');
        // Clear the input after successful check-in
        setUsn('');
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error: ", error);
      if (error.response) {
        setMessage(error.response?.data?.error || 'Server error');
      } else if (error.request) {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (selectedUsn) => {
    setUsn(selectedUsn);
    setSuggestions([]); // Clear suggestions after selection
  };

  return (
    <div className="p-5 text-center">
      {/* Logo section */}
      <div className="logo-container">
        <img src="title-logo.png" alt="Logo" className="logo" />
      </div>

      <h2 className="text-xl mb-3">Library Check-In</h2>

      <form onSubmit={handleCheckIn}>
        <input
          type="text"
          placeholder="Enter USN"
          value={usn}
          onChange={(e) => setUsn(e.target.value)}
          required
          className="border p-2 mb-3 w-full"
        />

        {usn && suggestions.length > 0 && (
          <div className="suggestions">
            {suggestions.map((student) => (
              <div
                key={student._id || student.usn}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(student.usn)}
              >
                {student.usn} - {student.name}
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className={`p-2 bg-blue-500 text-white w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Check-In'}
        </button>
      </form>

      {message && <p className="mt-3 text-green-500">{message}</p>}

      {message.includes('not found') && (
        <button
          className="mt-3 p-2 bg-red-500 text-white w-full"
          onClick={() => navigate('/student-registry')}
        >
          Register Now
        </button>
      )}
    </div>
  );
};

export default CheckIn;
