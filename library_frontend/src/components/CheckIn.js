import React, { useState } from 'react';
import axios from 'axios';

function CheckIn() {
  const [usn, setUsn] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [message, setMessage] = useState('');
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/entries/check-in', { 
        usn, 
        bookNumber: bookNumber || null 
      });
      
      setStudent(response.data.student);
      setMessage(response.data.message);
      setError('');
      setUsn('');
      setBookNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error checking in');
      setMessage('');
      setStudent(null);
    }
  };

  return (
    <div className="card">
      <h2>Library Check-In</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>USN</label>
          <input
            type="text"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
            placeholder="Enter your USN"
            required
          />
        </div>
        
        <div className="form-group">
          <label>Book Number (Optional)</label>
          <input
            type="text"
            value={bookNumber}
            onChange={(e) => setBookNumber(e.target.value)}
            placeholder="Enter book number if borrowing"
          />
        </div>
        
        <button type="submit">Check In</button>
      </form>
      
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      
      {student && (
        <div className="student-info">
          <h3>Check-In Confirmation:</h3>
          <p><strong>Name:</strong> {student.name}</p>
          <p><strong>USN:</strong> {student.usn}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Semester:</strong> {student.semester}</p>
          {student.bookCheckedIn && <p>✔ Book checked out</p>}
        </div>
      )}
    </div>
  );
}

export default CheckIn;