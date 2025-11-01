// components/dashboard/DashboardLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import './dashboard.scss';

const DashboardLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <div className="dashboard-main">
        <Topbar toggleSidebar={toggleSidebar} />
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
