import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import CheckIn from './components/CheckIn';
import CheckOut from './components/CheckOut';
import StudentRegistry from './components/StudentRegistry';
import Navbar from './components/Navbar';
import './styles.css';
import Footer from './components/Footer';
import AdminLogin from './components/AdminLogin'; 
import AdminDashboard from './components/AdminDashboard';  

// Wrapper component to conditionally render Navbar and Footer
function AppContent() {
  const location = useLocation();
  const isAdminDashboard = location.pathname === '/admin-dashboard';

  return (
    <>
      {!isAdminDashboard && <Navbar />}
      <div className="container">
        <Routes>
          <Route path="/" element={<CheckIn key="check-in" />} />
          <Route path="/check-in" element={<CheckIn key="check-in-route" />} />
          <Route path="/check-out" element={<CheckOut key="check-out" />} />
          <Route path="/student-registry" element={<StudentRegistry key="student-registry" />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
      {!isAdminDashboard && <Footer />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
