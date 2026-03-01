import React, { useState, useEffect } from 'react';
import { databases, functions } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Search, Crown, Shield, Ban, RefreshCw } from 'lucide-react';
import Modal from './Modal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    details: null,
    onConfirm: null,
  });

  const showModal = (type, title, message, details = null) => {
    setModal({ isOpen: true, type, title, message, details, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      details: null,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      details: null,
      onConfirm: null,
    });
  };

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;
  const SYNC_FUNCTION_ID = import.meta.env.VITE_APPWRITE_SYNC_FUNCTION_ID;
  const DELETE_FUNCTION_ID = import.meta.env.VITE_APPWRITE_DELETE_FUNCTION_ID;

  useEffect(() => {
    console.log('🔄 UserManagement mounted - loading users...');
    loadUsers();

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing users...');
      loadUsers();
    }, 30000);

    return () => {
      console.log('🛑 UserManagement unmounted - clearing interval');
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    console.log(`📊 Users state updated: ${users.length} users`);
  }, [users]);

  const loadUsers = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID
      );
      setUsers([...response.documents]);
      console.log(`✅ Loaded ${response.documents.length} users`);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (userId) => {
    showConfirm(
      'Upgrade to Pro',
      'Are you sure you want to upgrade this user to Pro plan?\n\nAll premium features will be enabled.',
      async () => {
        closeModal();
        try {
          await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
            plan: 'pro',
            planUpdatedAt: new Date().toISOString(),
            hasJournalAccess: true,
            hasStrategiesAccess: true,
            hasBotAccess: true,
            hasAnalyticsAccess: true,
          });
          loadUsers();
          showModal(
            'success',
            'Upgrade Successful!',
            'User has been upgraded to Pro.\nAll premium features are now enabled.'
          );
        } catch (error) {
          console.error('Error upgrading user:', error);
          showModal(
            'error',
            'Upgrade Failed',
            `Failed to upgrade user.\n\nError: ${error.message}`
          );
        }
      }
    );
  };

  const handleDowngrade = async (userId) => {
    showConfirm(
      'Downgrade to Free',
      'Are you sure you want to downgrade this user to Free plan?\n\nAll premium features will be disabled.',
      async () => {
        closeModal();
        try {
          await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
            plan: 'free',
            planUpdatedAt: new Date().toISOString(),
            hasJournalAccess: false,
            hasStrategiesAccess: false,
            hasBotAccess: false,
            hasAnalyticsAccess: false,
          });
          loadUsers();
          showModal(
            'success',
            'Downgrade Successful',
            'User has been downgraded to Free.\nAll premium features have been disabled.'
          );
        } catch (error) {
          console.error('Error downgrading user:', error);
          showModal(
            'error',
            'Downgrade Failed',
            `Failed to downgrade user.\n\nError: ${error.message}`
          );
        }
      }
    );
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      await loadUsers();
      const execution = await functions.createExecution(
        SYNC_FUNCTION_ID,
        '',
        false
      );
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        await loadUsers();
        if (result.orphansDeleted > 0 || result.missingCreated > 0) {
          showModal(
            'success',
            'Sync Complete!',
            'Users have been synchronized successfully.',
            {
              'Orphans Removed': result.orphansDeleted,
              'Missing Created': result.missingCreated,
            }
          );
        } else {
          showModal(
            'success',
            'Already Synced',
            'All users are already in sync.\nNo changes were needed.'
          );
        }
      } else {
        showModal(
          'error',
          'Sync Failed',
          `Failed to sync users.\n\nError: ${result.error}`
        );
      }
    } catch (err) {
      console.error('Sync error:', err);
      showModal(
        'error',
        'Sync Failed',
        `An error occurred during sync.\n\nError: ${err.message}`
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    showConfirm(
      '⚠️ Delete User',
      `Are you absolutely sure you want to delete "${userEmail}"?\n\nThis will permanently delete:\n• Their auth account\n• Their database record\n\nThis action CANNOT be undone!`,
      async () => {
        closeModal();
        try {
          const execution = await functions.createExecution(
            DELETE_FUNCTION_ID,
            JSON.stringify({ userId }),
            false
          );

          const result = JSON.parse(execution.responseBody);

          if (result.success) {
            await loadUsers();
            showModal(
              'success',
              'User Deleted',
              `User "${userEmail}" has been completely removed from the system.`,
              {
                'Auth Account': 'Deleted ✓',
                'Database Record': 'Deleted ✓',
              }
            );
          } else {
            const authStatus = result.authDeleted
              ? 'Deleted ✓'
              : `Failed - ${result.authError || 'Unknown error'}`;
            const dbStatus = result.dbDeleted
              ? 'Deleted ✓'
              : `Failed - ${result.dbError || 'Unknown error'}`;
            await loadUsers();
            showModal(
              'warning',
              'Partial Deletion',
              `User deletion completed with some issues.`,
              {
                'Auth Account': authStatus,
                'Database Record': dbStatus,
              }
            );
          }
        } catch (error) {
          console.error('Delete error:', error);
          showModal(
            'error',
            'Deletion Failed',
            `Failed to delete user.\n\nError: ${error.message}`
          );
        }
      }
    );
  };

  const handleSuspend = async (userId, currentStatus) => {
    const action = currentStatus === 'suspended' ? 'activate' : 'suspend';
    const actionCap = action.charAt(0).toUpperCase() + action.slice(1);

    showConfirm(
      `${actionCap} User`,
      `Are you sure you want to ${action} this user?`,
      async () => {
        closeModal();
        try {
          await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
            status: currentStatus === 'suspended' ? 'active' : 'suspended',
          });
          loadUsers();
          showModal(
            'success',
            `User ${actionCap}d`,
            `User has been ${action}ed successfully.`
          );
        } catch (error) {
          console.error(`Error ${action}ing user:`, error);
          showModal(
            'error',
            `${actionCap} Failed`,
            `Failed to ${action} user.\n\nError: ${error.message}`
          );
        }
      }
    );
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
          className="sync-users-btn"
          onClick={handleSyncUsers}
          disabled={syncing}
          title="Sync users between auth and database"
        >
          <RefreshCw size={18} className={syncing ? 'spinning' : ''} />
          {syncing ? 'Syncing...' : 'Sync Users'}
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
                    <div className="user-avatar-wrapper">
                      <div className="user-avatar">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      {user.plan !== 'pro' &&
                        (user.hasJournalAccess ||
                          user.hasStrategiesAccess ||
                          user.hasBotAccess ||
                          user.hasAnalyticsAccess) && (
                          <div
                            className="special-privilege-badge"
                            title="Special privileges granted"
                          >
                            ⭐
                          </div>
                        )}
                    </div>
                    <span>{user.name || 'Unknown'}</span>
                  </td>
                  <td>
                    <div className="email-cell">
                      {user.email}
                      {user.emailVerification === false && (
                        <span
                          className="unverified-badge"
                          title="Email not verified"
                        >
                          ⚠️ Unverified
                        </span>
                      )}
                    </div>
                  </td>
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
                      title="Delete user completely"
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

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        details={modal.details}
        onConfirm={modal.onConfirm}
        confirmText={modal.type === 'confirm' ? 'Ok' : undefined}
      />
    </div>
  );
};

export default UserManagement;
