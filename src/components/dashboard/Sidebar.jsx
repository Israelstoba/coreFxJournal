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
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png'; // 👈 your logo

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    alert('You have been logged out!');
    navigate('/');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      {/* Logo/Header */}
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">
          {/* 👇 Always show logo */}
          <img
            src={logo}
            alt="CoreFX Logo"
            className={`logo-img ${isOpen ? 'expanded' : 'collapsed'}`}
          />
        </Link>

        <button className="toggle-btn" onClick={toggleSidebar}>
          {isOpen ? '«' : '»'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          <Link to="/dashboard/overview">
            <li className="sidebar-list-items">
              <FaHome className="icon" />
              {isOpen && <span>Overview</span>}
            </li>
          </Link>
          <Link to="/dashboard">
            <li className="sidebar-list-items">
              <FaChartLine className="icon" />
              {isOpen && <span>Journal</span>}
            </li>
          </Link>
          <Link to="/dashboard/playbooks">
            <li className="sidebar-list-items">
              <FaBook className="icon" />
              {isOpen && <span>Playbooks</span>}
            </li>
          </Link>
          <Link to="/dashboard/bots">
            <li className="sidebar-list-items">
              <FaRobot className="icon" />
              {isOpen && <span>CFX Bots</span>}
            </li>
          </Link>
          <Link to="/dashboard/settings">
            <li className="sidebar-list-items">
              <FaCogs className="icon" />
              {isOpen && <span>Settings</span>}
            </li>
          </Link>
          <Link to="/dashboard/profile">
            <li className="sidebar-list-items">
              <FaUser className="icon" />
              {isOpen && <span>My Profile</span>}
            </li>
          </Link>
        </ul>
      </nav>

      {/* Logout Button */}
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
