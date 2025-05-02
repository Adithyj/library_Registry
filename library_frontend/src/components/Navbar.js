import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav>
      <ul style={{ display: 'flex', listStyle: 'none', gap: '20px', padding: '10px', background: '#f0f0f0' }}>
        <li><Link to="/">Check-In</Link></li>
        <li><Link to="/check-out">Check-Out</Link></li>
        <li><Link to="/semester-manager">Semester Manager</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;