import React, { useState } from 'react';
import { databases } from '../../lib/appwrite';
import { ID } from 'appwrite';
import {
  Check,
  X,
  Edit2,
  Save,
  DollarSign,
  Plus,
  Trash2,
  Settings,
} from 'lucide-react';

const PlanControl = () => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [plans, setPlans] = useState([
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      billingCycle: 'forever',
      features: [
        { name: 'Position Size Calculator', enabled: true, id: 1 },
        { name: 'Trading Journal', enabled: false, id: 2 },
        { name: 'Analytics Dashboard', enabled: false, id: 3 },
        { name: 'Custom Strategies', enabled: false, id: 4 },
        { name: 'Bot Access', enabled: false, id: 5 },
      ],
      limits: {
        maxJournalEntries: 10,
        maxStrategies: 0,
        maxBots: 0,
      },
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 29.99,
      billingCycle: 'monthly',
      features: [
        { name: 'Position Size Calculator', enabled: true, id: 1 },
        { name: 'Trading Journal', enabled: true, id: 2 },
        { name: 'Analytics Dashboard', enabled: true, id: 3 },
        { name: 'Custom Strategies', enabled: true, id: 4 },
        { name: 'Bot Access', enabled: true, id: 5 },
      ],
      limits: {
        maxJournalEntries: -1, // -1 = unlimited
        maxStrategies: -1,
        maxBots: 3,
      },
    },
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    trialPeriodDays: 7,
    allowFreeTrial: true,
    promoCode: '',
    discountPercentage: 0,
    maintenanceMode: false,
  });

  const toggleFeature = (planId, featureId) => {
    if (!editing) return;

    setPlans(
      plans.map((plan) => {
        if (plan.id === planId) {
          return {
            ...plan,
            features: plan.features.map((feature) =>
              feature.id === featureId
                ? { ...feature, enabled: !feature.enabled }
                : feature
            ),
          };
        }
        return plan;
      })
    );
  };

  const updatePlanPrice = (planId, newPrice) => {
    setPlans(
      plans.map((plan) =>
        plan.id === planId
          ? { ...plan, price: parseFloat(newPrice) || 0 }
          : plan
      )
    );
  };

  const updatePlanLimit = (planId, limitKey, value) => {
    setPlans(
      plans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              limits: {
                ...plan.limits,
                [limitKey]: parseInt(value) || 0,
              },
            }
          : plan
      )
    );
  };

  const addFeature = (planId, featureName) => {
    const newFeatureId =
      Math.max(...plans.flatMap((p) => p.features.map((f) => f.id))) + 1;

    setPlans(
      plans.map((plan) => ({
        ...plan,
        features: [
          ...plan.features,
          {
            id: newFeatureId,
            name: featureName,
            enabled: plan.id === planId,
          },
        ],
      }))
    );
  };

  const removeFeature = (featureId) => {
    setPlans(
      plans.map((plan) => ({
        ...plan,
        features: plan.features.filter((f) => f.id !== featureId),
      }))
    );
  };

  const handleSave = () => {
    setSaving(true);

    // Simulate save (no database needed for now)
    setTimeout(() => {
      setEditing(false);
      setSaving(false);

      // Log the configuration to console for reference
      console.log('📋 Plan Configuration:', {
        plans,
        globalSettings,
      });

      alert(
        '✅ Plan configuration updated!\n\n💡 Note: This is currently a visual planning tool. The actual plan enforcement happens through:\n• User Management (upgrade/downgrade buttons)\n• Feature Flags (individual user access control)'
      );
    }, 500);
  };

  const updateGlobalSetting = (key, value) => {
    setGlobalSettings({
      ...globalSettings,
      [key]: value,
    });
  };

  return (
    <div className="plan-control">
      <div className="plan-control-header">
        <div>
          <h2>Plan & Pricing Control</h2>
          <p>
            Configure subscription plans, pricing, features, and global settings
          </p>
        </div>
        <div className="header-actions">
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              <Edit2 size={18} />
              Edit Configuration
            </button>
          ) : (
            <>
              <button
                className="cancel-btn"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Global Settings */}
      <div className="global-settings">
        <h3>
          <Settings size={20} />
          Global Settings
        </h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Free Trial Period (days)</label>
            <input
              type="number"
              value={globalSettings.trialPeriodDays}
              onChange={(e) =>
                updateGlobalSetting('trialPeriodDays', parseInt(e.target.value))
              }
              disabled={!editing}
              min="0"
              max="30"
            />
          </div>
          <div className="setting-item">
            <label>Allow Free Trial</label>
            <input
              type="checkbox"
              checked={globalSettings.allowFreeTrial}
              onChange={(e) =>
                updateGlobalSetting('allowFreeTrial', e.target.checked)
              }
              disabled={!editing}
              className="checkbox-input"
            />
          </div>
          <div className="setting-item">
            <label>Promo Code</label>
            <input
              type="text"
              value={globalSettings.promoCode}
              onChange={(e) => updateGlobalSetting('promoCode', e.target.value)}
              disabled={!editing}
              placeholder="SAVE20"
            />
          </div>
          <div className="setting-item">
            <label>Discount Percentage</label>
            <input
              type="number"
              value={globalSettings.discountPercentage}
              onChange={(e) =>
                updateGlobalSetting(
                  'discountPercentage',
                  parseInt(e.target.value)
                )
              }
              disabled={!editing}
              min="0"
              max="100"
            />
          </div>
          <div className="setting-item">
            <label>Maintenance Mode</label>
            <input
              type="checkbox"
              checked={globalSettings.maintenanceMode}
              onChange={(e) =>
                updateGlobalSetting('maintenanceMode', e.target.checked)
              }
              disabled={!editing}
              className="checkbox-input"
            />
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="plans-config-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-config-card ${plan.id}`}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="price-section">
                <DollarSign size={20} />
                {editing ? (
                  <input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updatePlanPrice(plan.id, e.target.value)}
                    className="price-input"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <span className="price">${plan.price}</span>
                )}
                <span className="billing-cycle">/{plan.billingCycle}</span>
              </div>
            </div>

            <div className="plan-section">
              <h4>Features</h4>
              <div className="features-list">
                {plan.features.map((feature) => (
                  <div key={feature.id} className="feature-item">
                    <button
                      className={`feature-toggle ${
                        feature.enabled ? 'enabled' : 'disabled'
                      }`}
                      onClick={() => toggleFeature(plan.id, feature.id)}
                      disabled={!editing}
                    >
                      {feature.enabled ? <Check size={16} /> : <X size={16} />}
                    </button>
                    <span
                      className={
                        feature.enabled ? 'enabled-text' : 'disabled-text'
                      }
                    >
                      {feature.name}
                    </span>
                    {editing && (
                      <button
                        className="remove-feature-btn"
                        onClick={() => removeFeature(feature.id)}
                        title="Remove feature"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="plan-section">
              <h4>Usage Limits</h4>
              <div className="limits-grid">
                <div className="limit-item">
                  <label>Journal Entries</label>
                  {editing ? (
                    <input
                      type="number"
                      value={plan.limits.maxJournalEntries}
                      onChange={(e) =>
                        updatePlanLimit(
                          plan.id,
                          'maxJournalEntries',
                          e.target.value
                        )
                      }
                      placeholder="Unlimited"
                      min="-1"
                    />
                  ) : (
                    <span>
                      {plan.limits.maxJournalEntries === -1
                        ? 'Unlimited'
                        : plan.limits.maxJournalEntries}
                    </span>
                  )}
                </div>
                <div className="limit-item">
                  <label>Strategies</label>
                  {editing ? (
                    <input
                      type="number"
                      value={plan.limits.maxStrategies}
                      onChange={(e) =>
                        updatePlanLimit(
                          plan.id,
                          'maxStrategies',
                          e.target.value
                        )
                      }
                      min="-1"
                    />
                  ) : (
                    <span>
                      {plan.limits.maxStrategies === -1
                        ? 'Unlimited'
                        : plan.limits.maxStrategies}
                    </span>
                  )}
                </div>
                <div className="limit-item">
                  <label>Bots</label>
                  {editing ? (
                    <input
                      type="number"
                      value={plan.limits.maxBots}
                      onChange={(e) =>
                        updatePlanLimit(plan.id, 'maxBots', e.target.value)
                      }
                      min="-1"
                    />
                  ) : (
                    <span>
                      {plan.limits.maxBots === -1
                        ? 'Unlimited'
                        : plan.limits.maxBots}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="plan-control-note">
        <h4>💡 Configuration Tips:</h4>
        <ul>
          <li>
            <strong>-1 = Unlimited</strong> - Use -1 for unlimited access to a
            feature
          </li>
          <li>
            <strong>Promo Codes</strong> - Active promo codes apply globally to
            all new subscriptions
          </li>
          <li>
            <strong>Maintenance Mode</strong> - Blocks new signups but keeps
            existing users active
          </li>
          <li>
            <strong>Free Trial</strong> - Grants Pro access for the trial
            period, then downgrades to Free
          </li>
        </ul>
      </div>

      <div className="save-notice">
        <p>
          ℹ️ This is a <strong>visual planning tool</strong>. Changes are for
          reference only. Actual plan control is done via{' '}
          <strong>User Management</strong> and <strong>Feature Flags</strong>{' '}
          tabs.
        </p>
      </div>
    </div>
  );
};

export default PlanControl;
