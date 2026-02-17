import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Search, Crown, Shield, Ban, RefreshCw } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  useEffect(() => {
    console.log('🔄 UserManagement mounted - loading users...');
    loadUsers();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing users...');
      loadUsers();
    }, 30000);

    return () => {
      console.log('🛑 UserManagement unmounted - clearing interval');
      clearInterval(interval);
    };
  }, []);

  // Debug: Log when users state changes
  useEffect(() => {
    console.log(`📊 Users state updated: ${users.length} users`);
  }, [users]);

  const loadUsers = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID
      );

      // Force state update by creating new array
      setUsers([...response.documents]);

      console.log(`✅ Loaded ${response.documents.length} users`);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpgrade = async (userId) => {
    if (!confirm('Upgrade user to Pro plan?')) return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        plan: 'pro',
        planUpdatedAt: new Date().toISOString(),
        // Enable all features for Pro users
        hasJournalAccess: true,
        hasStrategiesAccess: true,
        hasBotAccess: true,
        hasAnalyticsAccess: true,
      });
      loadUsers();
      alert('User upgraded to Pro! All features enabled.');
    } catch (error) {
      console.error('Error upgrading user:', error);
      alert('Failed to upgrade user');
    }
  };

  const handleDowngrade = async (userId) => {
    if (
      !confirm(
        'Downgrade user to Free plan? All premium features will be disabled.'
      )
    )
      return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        plan: 'free',
        planUpdatedAt: new Date().toISOString(),
        // Disable all premium features for Free users
        hasJournalAccess: false,
        hasStrategiesAccess: false,
        hasBotAccess: false,
        hasAnalyticsAccess: false,
      });
      loadUsers();
      alert('User downgraded to Free. All premium features disabled.');
    } catch (error) {
      console.error('Error downgrading user:', error);
      alert('Failed to downgrade user');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !confirm(
        `⚠️ DANGER: Delete user "${userEmail}"?\n\nThis will:\n1. Remove their database record\n2. You'll need to manually delete their Auth account\n\nAre you absolutely sure?`
      )
    )
      return;

    try {
      await databases.deleteDocument(DATABASE_ID, USERS_TABLE_ID, userId);
      loadUsers();

      showDeleteInstructions(userId, userEmail);

      // Copy user ID to clipboard for easy lookup
      navigator.clipboard.writeText(userId).catch(() => {
        console.log('Could not copy user ID to clipboard');
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('❌ Failed to delete user record');
    }
  };

  const showDeleteInstructions = (userId, userEmail) => {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    // Create modal content
    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 500px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      ">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 32px;
          ">✓</div>
          <h2 style="margin: 0; color: #1a202c; font-size: 24px;">Database Record Deleted!</h2>
        </div>

        <div style="
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        ">
          <h3 style="
            margin: 0 0 12px 0;
            color: #856404;
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          ">
            ⚠️ Important: Complete the Deletion
          </h3>
          <p style="margin: 0 0 16px 0; color: #856404; line-height: 1.6; font-size: 14px;">
            To fully remove this user, you must also delete their authentication account:
          </p>
          <ol style="margin: 0; padding-left: 20px; color: #856404;">
            <li style="margin-bottom: 8px;">Go to <strong>Appwrite Console</strong></li>
            <li style="margin-bottom: 8px;">Navigate to <strong>Auth → Users</strong></li>
            <li style="margin-bottom: 8px;">Search for: <strong>${userEmail}</strong></li>
            <li>Click delete on their auth account</li>
          </ol>
        </div>

        <div style="
          background: #f7fafc;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 24px;
          font-family: monospace;
          font-size: 12px;
          color: #4a5568;
          text-align: center;
        ">
          User ID: ${userId}
          <div style="margin-top: 8px;">
            <button onclick="navigator.clipboard.writeText('${userId}'); this.innerHTML='✓ Copied!'; this.style.background='#4caf50';" style="
              padding: 6px 12px;
              background: #4caf50;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
            ">
              📋 Copy User ID
            </button>
          </div>
        </div>

        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
          width: 100%;
          padding: 12px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        ">
          Got It!
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Copy to clipboard automatically
    navigator.clipboard.writeText(userId).catch(() => {
      console.log('Could not copy user ID to clipboard');
    });

    // Remove modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  const handleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    if (!confirm(`${action} this user?`)) return;
    try {
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        status: currentStatus === 'suspended' ? 'active' : 'suspended',
      });
      loadUsers();
      alert(`User ${action}ed successfully!`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pro' && user.plan === 'pro') ||
      (filter === 'free' && user.plan === 'free') ||
      (filter === 'suspended' && user.status === 'suspended');
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <div className="loading-state">Loading users...</div>;
  }

  return (
    <div className="user-management">
      <div className="controls-bar">
        <button
          className="refresh-users-btn"
          onClick={() => loadUsers(true)}
          disabled={refreshing}
          title="Refresh user list"
        >
          <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All ({users.length})
          </button>
          <button
            className={filter === 'pro' ? 'active' : ''}
            onClick={() => setFilter('pro')}
          >
            Pro ({users.filter((u) => u.plan === 'pro').length})
          </button>
          <button
            className={filter === 'free' ? 'active' : ''}
            onClick={() => setFilter('free')}
          >
            Free ({users.filter((u) => u.plan === 'free').length})
          </button>
          <button
            className={filter === 'suspended' ? 'active' : ''}
            onClick={() => setFilter('suspended')}
          >
            Suspended ({users.filter((u) => u.status === 'suspended').length})
          </button>
        </div>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.$id}>
                  <td className="user-cell">
                    <div className="user-avatar">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span>{user.name || 'Unknown'}</span>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`plan-badge ${user.plan || 'free'}`}>
                      {user.plan === 'pro' && <Crown size={14} />}
                      {user.plan || 'Free'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status || 'active'}`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td>{new Date(user.$createdAt).toLocaleDateString()}</td>
                  <td>
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="action-buttons">
                    {user.plan !== 'pro' && (
                      <button
                        className="btn-upgrade"
                        onClick={() => handleUpgrade(user.$id)}
                        title="Upgrade to Pro"
                      >
                        <Crown size={16} />
                      </button>
                    )}
                    {user.plan === 'pro' && (
                      <button
                        className="btn-downgrade"
                        onClick={() => handleDowngrade(user.$id)}
                        title="Downgrade to Free"
                      >
                        <Shield size={16} />
                      </button>
                    )}
                    <button
                      className={`btn-suspend ${
                        user.status === 'suspended' ? 'active' : ''
                      }`}
                      onClick={() => handleSuspend(user.$id, user.status)}
                      title={
                        user.status === 'suspended' ? 'Activate' : 'Suspend'
                      }
                    >
                      <Ban size={16} />
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.$id, user.email)}
                      title="Delete user record"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
