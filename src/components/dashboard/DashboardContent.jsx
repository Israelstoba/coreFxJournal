// src/components/dashboard/DashboardContent.jsx
import React from 'react';
import Journal from '../../pages/dashboard/Journal';
import Playbooks from '../../pages/dashboard/Playbooks';
import CfxBot from '../../pages/dashboard/CfxBot';
import Settings from '../../pages/dashboard/Settings';
import Profile from '../../pages/dashboard/Profile';
// import DashboardContent from './DashboardContent';

const DashboardContent = ({ activePage }) => {
  switch (activePage) {
    case 'journal':
      return <Journal />;
    case 'playbooks':
      return <Playbooks />;
    case 'bot':
      return <CfxBot />;
    case 'settings':
      return <Settings />;
    case 'profile':
      return <Profile />;
    default:
      return <Journal />;
  }
};

export default DashboardContent;
