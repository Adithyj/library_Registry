import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import StudentRegistry from './components/StudentRegistry';
import Navbar from './components/Navbar';
import './styles.css';

function App() {
  return (
    <Router>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<CheckIn key="check-in" />} />       {/* 👈 Add key here */}
          <Route path="/check-out" element={<CheckOut key="check-out" />} />
          <Route path="/student-registry" element={<StudentRegistry key="student-registry" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
