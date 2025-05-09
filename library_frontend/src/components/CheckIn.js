import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CheckIn = () => {
  const [usn, setUsn] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      console.log("Sending USN: ", usn); // ✅ Add this for debugging

      const response = await axios.post('http://localhost:5000/entries/check-in', {
        usn: usn.trim() // ✅ Make sure there are no extra spaces
      });

      console.log("Response: ", response.data); // ✅ Add this for debugging

      if (response.data.message.includes('not found')) {
        setMessage('Student not found. You can register below.');
      } else {
        setMessage('Check-in successful');
      }
    } catch (error) {
      console.error("Error: ", error.response?.data); // ✅ Add this for debugging
      setMessage(error.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
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
