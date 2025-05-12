import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './checkin.css';

const CheckIn = () => {
  const [usn, setUsn] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (usn.length >= 3) {
      const fetchSuggestions = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`http://localhost:5000/students/search/${usn}`);
          setSuggestions(response.data);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [usn]);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/entries/check-in', {
        usn: usn.trim()
      });

      if (response.data.message.includes('not found')) {
        setMessage('Student not found. You can register below.');
      } else {
        setMessage('Check-in successful');
      }
    } catch (error) {
      console.error("Error: ", error.response?.data);
      setMessage(error.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 text-center">
      {/* Logo section */}
      <div className="logo-container">
        <img src="/title_logo.jpg" alt="Logo" className="logo" />
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
                key={student._id}
                className="suggestion-item"
                onClick={() => setUsn(student.usn)}
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
