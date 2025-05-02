import React, { useState } from 'react';
import axios from 'axios';

function CheckOut() {
  const [usn, setUsn] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/entries/check-out', { 
        usn, 
        bookNumber: bookNumber || null 
      });
      
      setMessage(response.data.message);
      setError('');
      setUsn('');
      setBookNumber('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error checking out');
      setMessage('');
    }
  };

  return (
    <div className="card">
      <h2>Library Check-Out</h2>
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
          <label>Book Number (If returning)</label>
          <input
            type="text"
            value={bookNumber}
            onChange={(e) => setBookNumber(e.target.value)}
            placeholder="Enter book number if returning"
          />
        </div>
        
        <button type="submit">Check Out</button>
      </form>
      
      {error && <p className="error">{error}</p>}
      {message && (
        <div className="success">
          <p>{message}</p>
          {message.includes('successful') && (
            <p>Duration: {message.split('Duration: ')[1]}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckOut;