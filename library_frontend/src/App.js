import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import SemesterManager from './components/SemesterManager';
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
          <Route path="/semester-manager" element={<SemesterManager />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;