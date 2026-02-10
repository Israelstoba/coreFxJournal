// components/dashboard/Sidebar.jsx

import React, { useEffect, useRef } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/cfx_logo.png';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const sidebarRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Close sidebar when clicking outside (mobile/tablet only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // ❌ Do nothing on desktop
      if (window.innerWidth > 768) return;

      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        toggleSidebar();
      }
    };

    // Only add listener if sidebar is open AND mobile/tablet
    if (isOpen && window.innerWidth <= 768) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, toggleSidebar]);

  // Helper to check if a link is active
  const isActive = (path) => location.pathname === path;

  // Close sidebar when link is clicked (mobile/tablet)
  const handleLinkClick = () => {
    if (isOpen && window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}
    >
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
          <Link to="/dashboard/journal" onClick={handleLinkClick}>
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/journal') ? 'active' : ''
              }`}
            >
              <FaChartLine className="icon" />
              {isOpen && <span>Journal</span>}
            </li>
          </Link>

          <Link to="/dashboard/playbooks" onClick={handleLinkClick}>
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/playbooks') ? 'active' : ''
              }`}
            >
              <FaBook className="icon" />
              {isOpen && <span>Playbooks</span>}
            </li>
          </Link>

          <Link to="/dashboard/bots" onClick={handleLinkClick}>
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/bots') ? 'active' : ''
              }`}
            >
              <FaRobot className="icon" />
              {isOpen && <span>CFX Bots</span>}
            </li>
          </Link>

          <Link to="/dashboard/settings" onClick={handleLinkClick}>
            <li
              className={`sidebar-list-items ${
                isActive('/dashboard/settings') ? 'active' : ''
              }`}
            >
              <FaCogs className="icon" />
              {isOpen && <span>Settings</span>}
            </li>
          </Link>

          <Link to="/dashboard/profile" onClick={handleLinkClick}>
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
