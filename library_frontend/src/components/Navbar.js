import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-3">
      <ul className="flex space-x-4">
        <li>
          <Link to="/check-in" className="hover:text-gray-400">
            Check In
          </Link>
        </li>
        <li>
          <Link to="/check-out" className="hover:text-gray-400">
            Check Out
          </Link>
        </li>
        <li>
          <Link to="/student-registry" className="hover:text-gray-400">
            Student Registry
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
