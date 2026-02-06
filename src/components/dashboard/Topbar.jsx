// components/dashboard/Topbar.jsx
import React from 'react';
import { FaBars } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const Topbar = ({ toggleSidebar }) => {
  const { user } = useAuth();

  // Get first name from user
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <header className="topbar">
      <button className="menu-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
      <div className="topbar-right">
        <span className="username">Hey, {firstName}</span>
        <div className="avatar">{firstName.charAt(0).toUpperCase()}</div>
      </div>
    </header>
  );
};

export default Topbar;
