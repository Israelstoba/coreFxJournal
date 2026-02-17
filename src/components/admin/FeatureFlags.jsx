import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { ToggleLeft, Search, Info, Check, X, RefreshCw } from 'lucide-react';

const FeatureFlags = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(null);
  const [showPlanInfo, setShowPlanInfo] = useState(true);

  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;

  const planFeatures = {
    free: {
      name: 'Free Plan',
      features: [
        { name: 'Position Size Calculator', enabled: true },
        { name: 'Trading Journal', enabled: false },
        { name: 'Custom Strategies', enabled: false },
        { name: 'Bot Access', enabled: false },
      ],
    },
    pro: {
      name: 'Pro Plan',
      features: [
        { name: 'Position Size Calculator', enabled: true },
        { name: 'Trading Journal', enabled: true },
        { name: 'Custom Strategies', enabled: true },
        { name: 'Bot Access', enabled: true },
      ],
    },
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_TABLE_ID
      );
      setUsers(response.documents);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (userId, feature, currentValue) => {
    setSaving(userId);
    try {
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        [feature]: !currentValue,
      });

      // Update local state immediately
      setUsers(
        users.map((user) =>
          user.$id === userId ? { ...user, [feature]: !currentValue } : user
        )
      );
    } catch (error) {
      console.error('Error toggling feature:', error);
      alert('Failed to update feature flag');
    } finally {
      setSaving(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="feature-flags-loading">
        <div className="spinner-large"></div>
        <p>Loading feature flags...</p>
      </div>
    );
  }

  return (
    <div className="feature-flags">
      <div className="feature-flags-header">
        <div>
          <h2>Feature Access Control</h2>
          <p>
            View plan configurations and override access for individual users
          </p>
        </div>
        <button className="refresh-btn" onClick={loadUsers}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Plan Configuration Reference */}
      {showPlanInfo && (
        <div className="plan-reference">
          <div className="plan-reference-header">
            <h3>
              <Info size={18} />
              Default Plan Features
            </h3>
            <button
              className="toggle-info-btn"
              onClick={() => setShowPlanInfo(false)}
            >
              Hide
            </button>
          </div>
          <div className="plans-grid">
            {Object.entries(planFeatures).map(([planId, plan]) => (
              <div key={planId} className={`plan-card ${planId}`}>
                <div className="plan-badge-header">
                  <span className={`plan-badge ${planId}`}>{plan.name}</span>
                </div>
                <div className="features-list">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <div
                        className={`feature-icon ${
                          feature.enabled ? 'enabled' : 'disabled'
                        }`}
                      >
                        {feature.enabled ? (
                          <Check size={14} />
                        ) : (
                          <X size={14} />
                        )}
                      </div>
                      <span
                        className={
                          feature.enabled ? 'enabled-text' : 'disabled-text'
                        }
                      >
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showPlanInfo && (
        <button className="show-info-btn" onClick={() => setShowPlanInfo(true)}>
          <Info size={16} />
          Show Plan Features Reference
        </button>
      )}

      {/* User-Level Feature Overrides */}
      <div className="user-overrides">
        <div className="overrides-header">
          <h3>User-Level Feature Overrides</h3>
          <p className="subtitle">
            Override default plan restrictions for individual users
          </p>
        </div>

        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flags-table-wrapper">
          <table className="flags-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Trading Journal</th>
                <th>Custom Strategies</th>
                <th>Bot Access</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state-cell">
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
                        {/* Show special privilege badge for free users with pro features */}
                        {user.plan !== 'pro' &&
                          (user.hasJournalAccess ||
                            user.hasStrategiesAccess ||
                            user.hasBotAccess ||
                            user.hasAnalyticsAccess) && (
                            <div
                              className="special-privilege-badge"
                              title="Special privileges granted by admin"
                            >
                              ⭐
                            </div>
                          )}
                      </div>
                      <div className="user-info">
                        <p className="user-name">{user.name || 'Unknown'}</p>
                        <p className="user-email">{user.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`plan-badge ${user.plan || 'free'}`}>
                        {user.plan || 'Free'}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${
                          user.hasJournalAccess ? 'active' : ''
                        }`}
                        onClick={() =>
                          toggleFeature(
                            user.$id,
                            'hasJournalAccess',
                            user.hasJournalAccess
                          )
                        }
                        disabled={saving === user.$id}
                      >
                        <ToggleLeft size={16} />
                        {user.hasJournalAccess ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${
                          user.hasStrategiesAccess ? 'active' : ''
                        }`}
                        onClick={() =>
                          toggleFeature(
                            user.$id,
                            'hasStrategiesAccess',
                            user.hasStrategiesAccess
                          )
                        }
                        disabled={saving === user.$id}
                      >
                        <ToggleLeft size={16} />
                        {user.hasStrategiesAccess ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td>
                      <button
                        className={`toggle-btn ${
                          user.hasBotAccess ? 'active' : ''
                        }`}
                        onClick={() =>
                          toggleFeature(
                            user.$id,
                            'hasBotAccess',
                            user.hasBotAccess
                          )
                        }
                        disabled={saving === user.$id}
                      >
                        <ToggleLeft size={16} />
                        {user.hasBotAccess ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="feature-flags-note">
        <div className="note-icon">💡</div>
        <div className="note-content">
          <h4>How Feature Overrides Work:</h4>
          <ul>
            <li>
              <strong>Override plan restrictions</strong> - Grant free users
              access to premium features for trials or special cases
            </li>
            <li>
              <strong>Instant changes</strong> - Feature access updates
              immediately without code deployment
            </li>
            <li>
              <strong>Test features</strong> - Enable features for select users
              before full rollout
            </li>
            <li>
              <strong>Suspend access</strong> - Disable features for suspended
              or problematic accounts
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FeatureFlags;
