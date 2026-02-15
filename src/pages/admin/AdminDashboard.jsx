import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { account } from '../../lib/appwrite';
import UserManagement from '../../components/admin/UserManagement';
import PlanControl from '../../components/admin/PlanControl';
import Analytics from '../../components/admin/Analytics';
import Revenue from '../../components/admin/Revenue';
import Payments from '../../components/admin/Payments';
import FeatureFlags from '../../components/admin/FeatureFlags';
import Announcements from '../../components/admin/Announcements';
import {
  Users,
  Shield,
  LogOut,
  BarChart3,
  DollarSign,
  CreditCard,
  Sliders,
  Megaphone,
} from 'lucide-react';
import './_admin.scss';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    setLoggingOut(true);
    try {
      await account.deleteSession('current');
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Logout failed. Please try again.');
      setLoggingOut(false);
    }
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, component: UserManagement },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: Analytics,
    },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, component: Revenue },
    {
      id: 'payments',
      label: 'Payments',
      icon: CreditCard,
      component: Payments,
    },
    {
      id: 'plan',
      label: 'Plan Control',
      icon: Shield,
      component: PlanControl,
    },
    {
      id: 'flags',
      label: 'Feature Flags',
      icon: Sliders,
      component: FeatureFlags,
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: Megaphone,
      component: Announcements,
    },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>CFX Admin Dashboard</h1>
        <button
          className="logout-button"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={18} />
          {loggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="admin-content">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default AdminDashboard;
