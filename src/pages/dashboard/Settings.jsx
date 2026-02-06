// pages/dashboard/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { databases } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';
import { FaUser, FaCog, FaPlus, FaTimes, FaSave } from 'react-icons/fa';
import '../../styles/dashboard/_settings.scss';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const response = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );

      if (response.documents.length > 0) {
        const userSettings = response.documents[0];
        setStrategies(userSettings.strategies || []);
        setSettingsDocId(userSettings.$id);
      } else {
        // Create initial settings document
        const newSettings = await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID,
          import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID,
          ID.unique(),
          {
            userId: user.$id,
            strategies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        );
        setSettingsDocId(newSettings.$id);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'Failed to load settings');
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
      // Note: Appwrite doesn't allow updating email/name through account.updateName
      // You'd need to use account.updateName() for name changes
      // Email changes require verification
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
      // Note: Appwrite requires old password to update
      // Use account.updatePassword(newPassword, oldPassword)
      showMessage('info', 'Password update feature coming soon');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      showMessage('error', error.message);
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

    const updatedStrategies = [...strategies, newStrategy.trim()];
    setLoading(true);

    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID,
        settingsDocId,
        {
          strategies: updatedStrategies,
          updatedAt: new Date().toISOString(),
        }
      );

      setStrategies(updatedStrategies);
      setNewStrategy('');
      showMessage('success', 'Strategy added successfully');
    } catch (error) {
      console.error('Error adding strategy:', error);
      showMessage('error', 'Failed to add strategy');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStrategy = async (strategyToRemove) => {
    const updatedStrategies = strategies.filter((s) => s !== strategyToRemove);
    setLoading(true);

    try {
      await databases.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_SETTINGS_COLLECTION_ID,
        settingsDocId,
        {
          strategies: updatedStrategies,
          updatedAt: new Date().toISOString(),
        }
      );

      setStrategies(updatedStrategies);
      showMessage('success', 'Strategy removed successfully');
    } catch (error) {
      console.error('Error removing strategy:', error);
      showMessage('error', 'Failed to remove strategy');
    } finally {
      setLoading(false);
    }
  };

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
