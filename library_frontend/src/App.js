import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import StudentRegistry from './components/StudentRegistry';  // ➡️ Import the StudentRegistry page
import Navbar from './components/Navbar';
import './styles.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<CheckIn />} />
          <Route path="/check-out" element={<CheckOut />} />
          <Route path="/student-registry" element={<StudentRegistry />} /> {/* ➡️ New Route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
