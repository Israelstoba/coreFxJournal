// components/dashboard/Topbar.jsx
import React from 'react';
import { FaBars } from 'react-icons/fa';

const Topbar = ({ toggleSidebar }) => {
  return (
    <header className="topbar">
      <button className="menu-btn" onClick={toggleSidebar}>
        <FaBars />
      </button>
      <div className="topbar-right">
        <span className="username">Welcome back, Stoba 👋</span>
        <img
          src="/assets/avatar-placeholder.png"
          alt="user"
          className="avatar"
        />
      </div>
    </header>
  );
};

export default Topbar;
