import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CheckOut = () => {
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all students currently checked in
  const fetchCheckedInStudents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/entries/checked-in');
      setCheckedInStudents(response.data);
      setFilteredStudents(response.data);  // Initialize filtered students
    } catch (error) {
      console.error('Error fetching checked-in students:', error);
    }
  };

  useEffect(() => {
    fetchCheckedInStudents();
  }, []);

  // Handle Search Query Change
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query === '') {
      setFilteredStudents(checkedInStudents); // Reset filter if search is empty
    } else {
      const filtered = checkedInStudents.filter((student) =>
        student.usn.toLowerCase().includes(query.toLowerCase()) ||
        student.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudents(filtered); // Filter students based on search query
    }
  };

  // Handle Check-Out process
  const handleCheckOut = async (usn) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('http://localhost:5000/entries/check-out', {
        usn,
        bookNumber: bookNumber || null
      });

      // Handle duration message
      let durationMessage = response.data.duration;
      if (response.data.duration === "0 minutes") {
        durationMessage = "less than a minute";
      }

      setMessage(`Check-out successful. Duration: ${durationMessage}`);
      setCheckedInStudents((prev) => prev.filter((student) => student.usn !== usn));
      setFilteredStudents((prev) => prev.filter((student) => student.usn !== usn));
    } catch (error) {
      console.error('Check-out error:', error);
      setMessage('Failed to check out.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      {/* Logo Section */}
      <div className="logo-container">
        <img src="title-logo.png" alt="Logo" className="logo" />
      </div>

      {/* Title Section */}
      <h2 className="text-xl mb-3">Library Check-Out</h2>
      
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search by USN or Name"
        value={searchQuery}
        onChange={handleSearchChange}
        className="border p-2 mb-3 w-full"
      />
      
      {message && <p className="mb-3 text-green-500">{message}</p>}
      
      {filteredStudents.length > 0 ? (
        <ul>
          {filteredStudents.map((student) => (
            <li key={student.usn} className="mb-2 p-2 border flex justify-between items-center">
              <div>
                <strong>{student.name}</strong> - {student.usn}
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  placeholder="Book Number (if any)"
                  value={bookNumber}
                  onChange={(e) => setBookNumber(e.target.value)}
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
