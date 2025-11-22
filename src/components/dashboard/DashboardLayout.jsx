// src/components/dashboard/DashboardLayout.jsx

import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardContent from './DashboardContent';
import '@/styles/dashboard/dashboard.scss';

// Import dashboard pages
import Overview from '@/pages/dashboard/Overview';
import Journal from '@/pages/dashboard/Journal';
import JournalDetails from '@/pages/dashboard/JournalDetails';
import Playbooks from '@/pages/dashboard/Playbooks';
import CfxBot from '@/pages/dashboard/CfxBot';
import Settings from '@/pages/dashboard/Settings';
import Profile from '@/pages/dashboard/Profile';

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      <div className="dashboard-main">
        <Topbar toggleSidebar={toggleSidebar} />

        <div className="dashboard-content">
          <Routes>
            {/* Dashboard pages */}
            <Route path="overview" element={<Overview />} />
            <Route path="journal" element={<Journal />} />
            <Route path="journal/:id" element={<JournalDetails />} />
            <Route path="playbooks" element={<Playbooks />} />
            <Route path="bots" element={<CfxBot />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />

            {/* Default fallback route */}
            <Route path="*" element={<Overview />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
