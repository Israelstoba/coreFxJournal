// components/dashboard/Sidebar.jsx

import React from 'react';
import {
  FaHome,
  FaChartLine,
  FaCogs,
  FaBook,
  FaRobot,
  FaUser,
  FaSignOutAlt,
} from 'react-icons/fa';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '@/assets/cfx logo.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 👈 detect current route

  const handleLogout = () => {
    alert('You have been logged out!');
    navigate('/');
  };

  // Helper to check if a link is active
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Logo/Header */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          <img src={logo} alt="CoreFX Logo" />
        </Link>

        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? '«' : '»'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          <Link to="/dashboard/overview">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/overview') ? 'active' : ''
              }`}
            >
              <FaHome className="icon" />
              {isOpen && <span>Overview</span>}
            </li>
          </Link>

          <Link to="/dashboard/journal">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/journal') ? 'active' : ''
              }`}
            >
              <FaChartLine className="icon" />
              {isOpen && <span>Journal</span>}
            </li>
          </Link>

          <Link to="/dashboard/playbooks">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/playbooks') ? 'active' : ''
              }`}
            >
              <FaBook className="icon" />
              {isOpen && <span>Playbooks</span>}
            </li>
          </Link>

          <Link to="/dashboard/bots">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/bots') ? 'active' : ''
              }`}
            >
              <FaRobot className="icon" />
              {isOpen && <span>CFX Bots</span>}
            </li>
          </Link>

          <Link to="/dashboard/settings">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/settings') ? 'active' : ''
              }`}
            >
              <FaCogs className="icon" />
              {isOpen && <span>Settings</span>}
            </li>
          </Link>

          <Link to="/dashboard/profile">
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/profile') ? 'active' : ''
              }`}
            >
              <FaUser className="icon" />
              {isOpen && <span>My Profile</span>}
            </li>
          </Link>
        </ul>
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt className="icon" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
