import React, { useState, useEffect } from 'react';
import { databases, functions } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { Search, Crown, Shield, Ban, RefreshCw } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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
    if (!confirm('Upgrade user to Pro plan?')) return;
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
          alert(
            `✅ Sync Complete!\n\n🗑️ Orphans Removed: ${result.orphansDeleted}\n➕ Missing Created: ${result.missingCreated}`
          );
        }
      } else {
        alert(`❌ Sync failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      alert('❌ Sync failed. Check console for details.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (
      !confirm(
        `⚠️ DANGER: Permanently delete user "${userEmail}"?\n\nThis will delete:\n• Their auth account\n• Their database record\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`
      )
    )
      return;
    try {
      console.log('🗑️ Deleting user:', userId);
      console.log('DELETE_FUNCTION_ID:', DELETE_FUNCTION_ID);

      const execution = await functions.createExecution(
        DELETE_FUNCTION_ID,
        JSON.stringify({ userId }),
        false
      );

      console.log('Execution response:', execution);
      console.log('Response body:', execution.responseBody);

      const result = JSON.parse(execution.responseBody);
      console.log('Parsed result:', result);

      if (result.success) {
        await loadUsers();
        alert(
          '✅ User Completely Deleted!\n\nAuth Account: Deleted ✓\nDatabase Record: Deleted ✓'
        );
      } else {
        const authStatus = result.authDeleted
          ? 'Deleted ✓'
          : `Failed - ${result.authError || 'Unknown error'}`;
        const dbStatus = result.dbDeleted
          ? 'Deleted ✓'
          : `Failed - ${result.dbError || 'Unknown error'}`;
        alert(
          `⚠️ Partial Deletion\n\nAuth: ${authStatus}\nDatabase: ${dbStatus}`
        );
        await loadUsers();
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      console.error('Error details:', error.message, error.stack);
      alert(
        `❌ Failed to delete user.\n\nError: ${error.message}\n\nCheck console for details.`
      );
    }
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
    </div>
  );
};

export default UserManagement;
