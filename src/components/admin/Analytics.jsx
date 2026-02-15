import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import {
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Calendar,
  Activity,
  Crown,
} from 'lucide-react';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    newUsersThisMonth: 0,
    activeToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID
      );

      const users = response.documents;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));

      const analytics = {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status !== 'suspended').length,
        suspendedUsers: users.filter((u) => u.status === 'suspended').length,
        proUsers: users.filter((u) => u.plan === 'pro').length,
        freeUsers: users.filter((u) => u.plan !== 'pro').length,
        newUsersThisMonth: users.filter(
          (u) => new Date(u.$createdAt) >= startOfMonth
        ).length,
        activeToday: users.filter(
          (u) => u.lastActive && new Date(u.lastActive) >= startOfDay
        ).length,
      };

      setStats(analytics);

      // Get recent activity (last 10 users)
      const recent = users
        .sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt))
        .slice(0, 10);
      setRecentActivity(recent);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-content">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );

  if (loading) {
    return <div className="loading-state">Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="stats-grid">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Active Users"
          value={stats.activeUsers}
          color="green"
        />
        <StatCard
          icon={Crown}
          label="Pro Users"
          value={stats.proUsers}
          color="gold"
        />
        <StatCard
          icon={UserX}
          label="Suspended"
          value={stats.suspendedUsers}
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          label="New This Month"
          value={stats.newUsersThisMonth}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label="Active Today"
          value={stats.activeToday}
          color="teal"
        />
      </div>

      <div className="recent-activity">
        <h2>
          <Calendar size={20} />
          Recent User Registrations
        </h2>
        <div className="activity-list">
          {recentActivity.map((user) => (
            <div key={user.$id} className="activity-item">
              <div className="user-info">
                <div className="user-avatar">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="user-name">{user.name || 'Unknown'}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              <div className="activity-meta">
                <span className={`plan-badge ${user.plan || 'free'}`}>
                  {user.plan === 'pro' && <Crown size={12} />}
                  {user.plan || 'Free'}
                </span>
                <span className="activity-date">
                  {new Date(user.$createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
