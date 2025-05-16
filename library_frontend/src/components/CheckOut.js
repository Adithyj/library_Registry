import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// Create axios instance with timeout
const api = axios.create({
  timeout: 5000, // 5 seconds timeout
  headers: {
    'Cache-Control': 'no-cache'
  }
});

const CheckOut = () => {
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Fetch all students currently checked in
  const fetchCheckedInStudents = useCallback(async () => {
    setFetchLoading(true);
    setError('');
    try {
      const response = await api.get('http://localhost:5000/api/entries/checked-in');
      setCheckedInStudents(response.data);
      setFilteredStudents(response.data);  // Initialize filtered students
    } catch (error) {
      console.error('Error fetching checked-in students:', error);
      if (error.response) {
        setError(`Server error: ${error.response.status}`);
      } else if (error.request) {
        setError('Network error. Please check your connection.');
      } else {
        setError('Failed to load students. Please try refreshing.');
      }
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCheckedInStudents();
    
    // Optional: Poll for updates every 30 seconds
    const intervalId = setInterval(() => {
      fetchCheckedInStudents();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchCheckedInStudents]);

  // Handle Search Query Change - client-side filtering for better performance
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredStudents(checkedInStudents);
    } else {
      // More efficient filtering
      setFilteredStudents(
        checkedInStudents.filter(
          student => 
            (student.usn && student.usn.toLowerCase().includes(query)) || 
            (student.name && student.name.toLowerCase().includes(query))
        )
      );
    }
  };

  // Handle Check-Out process for a specific student
  const handleCheckOut = async (usn) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('http://localhost:5000/api/entries/check-out', {
        usn,
        bookNumber: bookNumber || null
      });

      // Handle duration message
      let durationMessage = response.data.duration;
      if (response.data.duration === "0 minutes") {
        durationMessage = "less than a minute";
      }

      setMessage(`Check-out successful. Duration: ${durationMessage}`);
      
      // Update local state
      const updatedStudents = checkedInStudents.filter(student => student.usn !== usn);
      setCheckedInStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      
      // Clear book number after checkout
      setBookNumber('');
    } catch (error) {
      console.error('Check-out error:', error);
      if (error.response) {
        setMessage(`Failed to check out: ${error.response.data?.error || 'Server error'}`);
      } else if (error.request) {
        setMessage('Network error. Please check your connection.');
      } else {
        setMessage('Failed to check out. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle book number input for a specific student
  const handleBookNumberChange = (e) => {
    setBookNumber(e.target.value);
  };

  // Refresh data manually
  const handleRefresh = () => {
    fetchCheckedInStudents();
  };

  return (
    <div className="p-5">
      {/* Logo Section */}
      <div className="logo-container">
        <img src="title-logo.png" alt="Logo" className="logo" />
      </div>

      {/* Title Section */}
      <h2 className="text-xl mb-3">Library Check-Out</h2>
      
      {/* Refresh Button */}
      <button 
        onClick={handleRefresh} 
        disabled={fetchLoading}
        className="p-2 bg-gray-200 mb-3 text-gray-800 rounded"
      >
        {fetchLoading ? 'Refreshing...' : '↻ Refresh'}
      </button>
      
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by USN or Name"
        value={searchQuery}
        onChange={handleSearchChange}
        className="border p-2 mb-3 w-full"
        disabled={fetchLoading}
      />
      
      {message && <p className="mb-3 text-green-500">{message}</p>}
      {error && <p className="mb-3 text-red-500">{error}</p>}
      
      {fetchLoading ? (
        <p>Loading students...</p>
      ) : filteredStudents.length > 0 ? (
        <ul>
          {filteredStudents.map((student) => (
            <li key={student.usn || student.id} className="mb-2 p-2 border flex justify-between items-center">
              <div>
                <strong>{student.name}</strong> - {student.usn}
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Book Number (if any)"
                  value={bookNumber}
                  onChange={handleBookNumberChange}
                  className="border p-1 mr-2"
                />
                <button
                  onClick={() => handleCheckOut(student.usn)}
                  disabled={loading}
                  className={`p-2 bg-red-500 text-white ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Processing...' : 'Check Out'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No students currently checked in.</p>
      )}
    </div>
  );
};

export default CheckOut;
