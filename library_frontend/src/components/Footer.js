import React from 'react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white p-4 mt-5 text-center">
      <p>&copy; {new Date().getFullYear()} Sahyadri College of Engineering & Management. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;
