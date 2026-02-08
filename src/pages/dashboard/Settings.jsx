// pages/dashboard/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { databases } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';
import { FaUser, FaCog, FaPlus, FaTimes, FaSave } from 'react-icons/fa';
import '../../styles/dashboard/_settings.scss';

const Settings = () => {
  const { user, updatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get Table ID from environment
  const TABLE_ID = import.meta.env.VITE_APPWRITE_SETTINGS_TABLE_ID;
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

  // Profile State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Trade Settings State
  const [strategies, setStrategies] = useState([]);
  const [newStrategy, setNewStrategy] = useState('');
  const [settingsDocId, setSettingsDocId] = useState(null);

  // Load user settings on mount
  useEffect(() => {
    let isMounted = true;

    const initSettings = async () => {
      if (user && isMounted) {
        await loadUserSettings();
      }
    };

    initSettings();

    return () => {
      isMounted = false;
    };
  }, [user?.$id]);

  const loadUserSettings = async () => {
    if (!DATABASE_ID || !TABLE_ID) {
      showMessage('error', 'Database configuration missing');
      console.error('Missing environment variables:', {
        DATABASE_ID,
        TABLE_ID,
      });
      return;
    }

    try {
      const response = await databases.listDocuments(DATABASE_ID, TABLE_ID, [
        Query.equal('userId', user.$id),
      ]);

      if (response.documents.length > 0) {
        // Use the first document
        const userSettings = response.documents[0];
        setStrategies(userSettings.strategies || []);
        setSettingsDocId(userSettings.$id);

        // Clean up duplicates if they exist
        if (response.documents.length > 1) {
          console.log(
            `Found ${response.documents.length} duplicate settings documents. Cleaning up...`
          );

          // Delete all duplicates except the first one
          for (let i = 1; i < response.documents.length; i++) {
            try {
              await databases.deleteDocument(
                DATABASE_ID,
                TABLE_ID,
                response.documents[i].$id
              );
              console.log(`Deleted duplicate: ${response.documents[i].$id}`);
            } catch (error) {
              console.error(`Error deleting duplicate: ${error}`);
            }
          }
        }
      } else {
        // Create initial settings document only if none exists
        const newSettings = await databases.createDocument(
          DATABASE_ID,
          TABLE_ID,
          ID.unique(),
          {
            userId: user.$id,
            strategies: [],
          }
        );
        setSettingsDocId(newSettings.$id);
        showMessage('success', 'Settings initialized');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', `Failed to load settings: ${error.message}`);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Profile Handlers
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      showMessage(
        'info',
        'Profile updates coming soon - contact support to change email'
      );
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.currentPassword) {
      showMessage('error', 'Current password is required');
      return;
    }

    if (!passwordData.newPassword) {
      showMessage('error', 'New password is required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(
        passwordData.newPassword,
        passwordData.currentPassword
      );
      showMessage('success', 'Password updated successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Password update error:', error);
      if (error.code === 401) {
        showMessage('error', 'Current password is incorrect');
      } else {
        showMessage('error', error.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Strategy Handlers
  const handleAddStrategy = async () => {
    if (!newStrategy.trim()) {
      showMessage('error', 'Strategy name cannot be empty');
      return;
    }

    if (strategies.includes(newStrategy.trim())) {
      showMessage('error', 'Strategy already exists');
      return;
    }

    if (!settingsDocId) {
      showMessage(
        'error',
        'Settings not initialized. Please refresh the page.'
      );
      return;
    }

    const updatedStrategies = [...strategies, newStrategy.trim()];
    setLoading(true);

    try {
      await databases.updateDocument(DATABASE_ID, TABLE_ID, settingsDocId, {
        strategies: updatedStrategies,
      });

      setStrategies(updatedStrategies);
      setNewStrategy('');
      showMessage('success', 'Strategy added successfully');
    } catch (error) {
      console.error('Error adding strategy:', error);
      showMessage('error', `Failed to add strategy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStrategy = async (strategyToRemove) => {
    if (!settingsDocId) {
      showMessage(
        'error',
        'Settings not initialized. Please refresh the page.'
      );
      return;
    }

    const updatedStrategies = strategies.filter((s) => s !== strategyToRemove);
    setLoading(true);

    try {
      await databases.updateDocument(DATABASE_ID, TABLE_ID, settingsDocId, {
        strategies: updatedStrategies,
      });

      setStrategies(updatedStrategies);
      showMessage('success', 'Strategy removed successfully');
    } catch (error) {
      console.error('Error removing strategy:', error);
      showMessage('error', `Failed to remove strategy: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        {/* Message Alert */}
        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FaUser /> Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'trade' ? 'active' : ''}`}
            onClick={() => setActiveTab('trade')}
          >
            <FaCog /> Trade Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="tab-panel">
              <h2>Profile Information</h2>

              {/* Display User Info */}
              <div className="profile-info">
                <div className="info-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData({ ...profileData, name: e.target.value })
                    }
                    disabled
                  />
                  <small>Contact support to update your name</small>
                </div>

                <div className="info-group">
                  <label>Email Address</label>
                  <input type="email" value={profileData.email} disabled />
                  <small>Contact support to update your email</small>
                </div>

                <div className="info-group">
                  <label>User ID</label>
                  <input type="text" value={user.$id} disabled />
                </div>
              </div>

              {/* Change Password Section */}
              <div className="password-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordUpdate}>
                  <div className="info-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="info-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>

                  <div className="info-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button type="submit" className="btn-save" disabled={loading}>
                    <FaSave /> {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TRADE SETTINGS TAB */}
          {activeTab === 'trade' && (
            <div className="tab-panel">
              <h2>Trading Strategies</h2>
              <p className="tab-description">
                Add your favorite trading strategies. These will appear in your
                trade journal strategy dropdown for quick selection.
              </p>

              {/* Add Strategy Input */}
              <div className="add-strategy">
                <input
                  type="text"
                  value={newStrategy}
                  onChange={(e) => setNewStrategy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddStrategy()}
                  placeholder="Enter strategy name (e.g., Breakout, Scalping, Swing)"
                  className="strategy-input"
                />
                <button
                  onClick={handleAddStrategy}
                  className="btn-add"
                  disabled={loading || !newStrategy.trim()}
                >
                  <FaPlus /> Add
                </button>
              </div>

              {/* Strategies List */}
              <div className="strategies-list">
                {strategies.length === 0 ? (
                  <div className="empty-state">
                    <FaCog size={48} />
                    <p>No strategies added yet</p>
                    <small>Add your first trading strategy above</small>
                  </div>
                ) : (
                  <div className="strategy-tags">
                    {strategies.map((strategy, index) => (
                      <div key={index} className="strategy-tag">
                        <span>{strategy}</span>
                        <button
                          onClick={() => handleRemoveStrategy(strategy)}
                          className="remove-btn"
                          disabled={loading}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Strategy Count */}
              {strategies.length > 0 && (
                <div className="strategy-count">
                  <small>
                    {strategies.length}{' '}
                    {strategies.length === 1 ? 'strategy' : 'strategies'} saved
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
