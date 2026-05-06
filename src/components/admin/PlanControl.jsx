import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import {
  Check,
  X,
  Edit2,
  Save,
  Trash2,
  Tag,
  Clock,
  Gift,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle,
  Zap,
} from 'lucide-react';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;
const PROMO_TABLE_ID = import.meta.env.VITE_APPWRITE_PROMO_TABLE_ID;

// ─── Admin theme tokens ────────────────────────────────────────────────────────
const T = {
  bg: '#f5f5f5',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f0f0f0',
  accent: '#4caf50',
  accentHover: '#45a049',
  accentLight: '#e8f5e9',
  accentDark: '#2e7d32',
  text: '#1a1a1a',
  textMuted: '#666',
  textLight: '#999',
  shadow: '0 2px 8px rgba(0,0,0,0.1)',
  shadowHover: '0 4px 12px rgba(76,175,80,0.25)',
  radius: '12px',
  radiusSm: '8px',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALL_FEATURES = [
  { key: 'hasJournalAccess', label: 'Trading Journal' },
  { key: 'hasStrategiesAccess', label: 'Custom Strategies' },
  { key: 'hasBotAccess', label: 'Bot Access' },
  { key: 'hasAnalyticsAccess', label: 'Analytics Dashboard' },
];

const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

const daysFromNow = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const isExpired = (expiresAt) => expiresAt && new Date(expiresAt) < new Date();

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: '#f9f9f9',
  border: `1px solid ${T.border}`,
  borderRadius: T.radiusSm,
  padding: '9px 12px',
  color: T.text,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: T.textMuted,
  marginBottom: 6,
};

const ghostBtn = {
  background: T.card,
  border: `2px solid ${T.border}`,
  borderRadius: T.radiusSm,
  padding: '8px 16px',
  color: T.accent,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
};

const primaryBtn = {
  background: T.accent,
  border: 'none',
  borderRadius: T.radiusSm,
  padding: '9px 20px',
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 8px rgba(76,175,80,0.3)',
};

const cardStyle = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: T.radius,
  padding: 24,
  boxShadow: T.shadow,
  marginBottom: 20,
};

const sectionTitle = {
  margin: '0 0 20px',
  color: T.text,
  fontSize: 15,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

// ─── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ children, variant = 'default' }) => {
  const styles = {
    default: { background: '#e0e0e0', color: T.textMuted },
    success: { background: '#d4edda', color: '#155724' },
    warning: { background: '#fff3cd', color: '#856404' },
    danger: { background: '#f8d7da', color: '#721c24' },
    info: { background: '#e3f2fd', color: '#1976d2' },
  };
  return (
    <span
      style={{
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
};

// ─── Toggle ───────────────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    onClick={onChange}
    disabled={disabled}
    style={{
      background: 'none',
      border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: checked ? T.accent : '#ccc',
      display: 'flex',
      alignItems: 'center',
      padding: 0,
      opacity: disabled ? 0.5 : 1,
      transition: 'color 0.2s',
    }}
  >
    {checked ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
  </button>
);

// ─── Promo Row ────────────────────────────────────────────────────────────────
const PromoRow = ({ promo, onToggle, onDelete, saving }) => {
  const [copied, setCopied] = useState(false);
  const expired = isExpired(promo.expiresAt);

  const copy = () => {
    navigator.clipboard.writeText(promo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <tr
      style={{
        borderBottom: `1px solid ${T.borderLight}`,
        transition: 'background 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9f9f9')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <code
            style={{
              background: '#f5f5f5',
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '3px 10px',
              fontSize: 13,
              fontFamily: 'monospace',
              color: T.text,
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {promo.code}
          </code>
          <button
            onClick={copy}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: copied ? T.accent : T.textLight,
              padding: 0,
            }}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        {promo.discountPercentage > 0 && (
          <span style={{ color: T.accent, fontWeight: 600 }}>
            {promo.discountPercentage}% off
          </span>
        )}
        {promo.trialDays > 0 && (
          <span
            style={{
              color: '#1976d2',
              marginLeft: promo.discountPercentage > 0 ? 8 : 0,
              fontWeight: 600,
            }}
          >
            +{promo.trialDays}d trial
          </span>
        )}
        {promo.features?.length > 0 && (
          <span style={{ color: '#7b1fa2', marginLeft: 8, fontWeight: 600 }}>
            +{promo.features.length} features
          </span>
        )}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>
        {promo.usedCount ?? 0} / {promo.maxUses === -1 ? '∞' : promo.maxUses}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: T.textMuted }}>
        {promo.expiresAt ? (
          expired ? (
            <Badge variant="danger">Expired</Badge>
          ) : (
            new Date(promo.expiresAt).toLocaleDateString()
          )
        ) : (
          <span style={{ color: T.textLight }}>Never</span>
        )}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <Toggle
          checked={promo.isActive && !expired}
          onChange={() => onToggle(promo.$id, promo.isActive)}
          disabled={saving === promo.$id || expired}
        />
      </td>
      <td style={{ padding: '12px 16px' }}>
        <button
          onClick={() => onDelete(promo.$id)}
          disabled={saving === promo.$id}
          style={{
            background: '#ffebee',
            border: '2px solid #fee2e2',
            borderRadius: 8,
            cursor: 'pointer',
            color: '#c62828',
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: saving === promo.$id ? 0.4 : 1,
            transition: 'all 0.2s ease',
          }}
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
};

// ─── Create Promo Modal ───────────────────────────────────────────────────────
const CreatePromoModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    code: generateCode(),
    discountPercentage: 0,
    trialDays: 0,
    features: [],
    maxUses: -1,
    expiresAfterDays: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const toggleFeature = (key) =>
    set(
      'features',
      form.features.includes(key)
        ? form.features.filter((f) => f !== key)
        : [...form.features, key],
    );

  const submit = async () => {
    if (!form.code.trim()) return;
    setSubmitting(true);
    await onCreate({
      code: form.code.toUpperCase(),
      discountPercentage: parseInt(form.discountPercentage) || 0,
      trialDays: parseInt(form.trialDays) || 0,
      features: form.features,
      maxUses: parseInt(form.maxUses) || -1,
      usedCount: 0,
      expiresAt: form.expiresAfterDays
        ? daysFromNow(parseInt(form.expiresAfterDays))
        : null,
      isActive: true,
    });
    setSubmitting(false);
    onClose();
  };

  const modalInput = { ...inputStyle, background: '#f9f9f9' };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius,
          padding: 32,
          width: 480,
          maxWidth: '95vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
      >
        <h3
          style={{
            margin: '0 0 24px',
            color: T.text,
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          Create Promo Code
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                style={{
                  ...modalInput,
                  flex: 1,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                }}
              />
              <button
                onClick={() => set('code', generateCode())}
                style={{ ...ghostBtn, padding: '8px 12px' }}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discountPercentage}
                onChange={(e) => set('discountPercentage', e.target.value)}
                style={modalInput}
              />
            </div>
            <div>
              <label style={labelStyle}>Trial Days</label>
              <input
                type="number"
                min="0"
                value={form.trialDays}
                onChange={(e) => set('trialDays', e.target.value)}
                style={modalInput}
              />
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}
          >
            <div>
              <label style={labelStyle}>Max Uses (-1 = unlimited)</label>
              <input
                type="number"
                min="-1"
                value={form.maxUses}
                onChange={(e) => set('maxUses', e.target.value)}
                style={modalInput}
              />
            </div>
            <div>
              <label style={labelStyle}>Expires After (days)</label>
              <input
                type="number"
                min="1"
                placeholder="Never"
                value={form.expiresAfterDays}
                onChange={(e) => set('expiresAfterDays', e.target.value)}
                style={modalInput}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Grant Features</label>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginTop: 8,
              }}
            >
              {ALL_FEATURES.map((f) => (
                <button
                  key={f.key}
                  onClick={() => toggleFeature(f.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    border: '2px solid',
                    ...(form.features.includes(f.key)
                      ? {
                          background: T.accentLight,
                          borderColor: T.accent,
                          color: T.accentDark,
                        }
                      : {
                          background: '#f9f9f9',
                          borderColor: T.border,
                          color: T.textMuted,
                        }),
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 28,
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} style={ghostBtn}>
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            style={{ ...primaryBtn, opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Creating...' : 'Create Code'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Active Trials Panel ──────────────────────────────────────────────────────
const ActiveTrials = ({ users, onExpireNow, saving }) => {
  const trialUsers = users.filter(
    (u) => u.trialEndsAt && new Date(u.trialEndsAt) > new Date(),
  );
  if (trialUsers.length === 0) {
    return (
      <div
        style={{ textAlign: 'center', padding: '40px 0', color: T.textLight }}
      >
        <Clock size={36} style={{ marginBottom: 10, opacity: 0.3 }} />
        <p style={{ margin: 0, fontSize: 14 }}>No active free trials</p>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {trialUsers.map((user) => {
        const endsAt = new Date(user.trialEndsAt);
        const daysLeft = Math.ceil((endsAt - new Date()) / 86400000);
        return (
          <div
            key={user.$id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f9f9f9',
              border: `1px solid ${T.borderLight}`,
              borderRadius: T.radiusSm,
              padding: '12px 16px',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 600,
                  color: T.text,
                }}
              >
                {user.name || 'Unknown'}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
                {user.email}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge variant={daysLeft <= 2 ? 'warning' : 'info'}>
                {daysLeft}d left
              </Badge>
              <button
                onClick={() => onExpireNow(user.$id)}
                disabled={saving === user.$id}
                style={{
                  background: '#ffebee',
                  border: '2px solid #ffcdd2',
                  borderRadius: 8,
                  padding: '5px 12px',
                  color: '#c62828',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: saving === user.$id ? 'not-allowed' : 'pointer',
                  opacity: saving === user.$id ? 0.5 : 1,
                }}
              >
                Expire Now
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Manual Apply Sub-component ───────────────────────────────────────────────
const ManualApply = ({ users, promoCodes, onApply, saving }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPromo, setSelectedPromo] = useState('');
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-end',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: 1, minWidth: 180 }}>
        <label style={labelStyle}>User</label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select user…</option>
          {users.map((u) => (
            <option key={u.$id} value={u.$id}>
              {u.name || u.email} ({u.plan || 'free'})
            </option>
          ))}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 150 }}>
        <label style={labelStyle}>Promo Code</label>
        <select
          value={selectedPromo}
          onChange={(e) => setSelectedPromo(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select code…</option>
          {promoCodes.map((p) => (
            <option key={p.$id} value={p.$id}>
              {p.code} —{' '}
              {p.discountPercentage > 0 ? `${p.discountPercentage}% off` : ''}
              {p.trialDays > 0 ? ` ${p.trialDays}d trial` : ''}
            </option>
          ))}
        </select>
      </div>
      <button
        disabled={!selectedUser || !selectedPromo || saving}
        onClick={() => {
          const promo = promoCodes.find((p) => p.$id === selectedPromo);
          if (promo) onApply(selectedUser, promo);
        }}
        style={{
          ...primaryBtn,
          opacity: !selectedUser || !selectedPromo || saving ? 0.5 : 1,
          cursor:
            !selectedUser || !selectedPromo || saving
              ? 'not-allowed'
              : 'pointer',
        }}
      >
        <Zap size={14} /> Apply
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PlanControl = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tab, setTab] = useState('promos');
  const [toast, setToast] = useState(null);
  const [plans, setPlans] = useState([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      billingCycle: 'forever',
      features: {
        hasJournalAccess: false,
        hasStrategiesAccess: false,
        hasBotAccess: false,
        hasAnalyticsAccess: false,
      },
      limits: { maxJournalEntries: 10, maxStrategies: 0, maxBots: 0 },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      billingCycle: 'monthly',
      features: {
        hasJournalAccess: true,
        hasStrategiesAccess: true,
        hasBotAccess: true,
        hasAnalyticsAccess: true,
      },
      limits: { maxJournalEntries: -1, maxStrategies: -1, maxBots: 3 },
    },
  ]);
  const [editingPlans, setEditingPlans] = useState(false);

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [promoRes, userRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, PROMO_TABLE_ID),
        databases.listDocuments(DATABASE_ID, USERS_TABLE_ID),
      ]);
      setPromoCodes(promoRes.documents);
      setUsers(userRes.documents);
    } catch (err) {
      console.error(err);
      notify('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createPromo = async (data) => {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        PROMO_TABLE_ID,
        'unique()',
        data,
      );
      setPromoCodes((prev) => [doc, ...prev]);
      notify('Promo code created!');
    } catch {
      notify('Failed to create promo code', 'error');
    }
  };

  const togglePromo = async (id, current) => {
    setSaving(id);
    try {
      await databases.updateDocument(DATABASE_ID, PROMO_TABLE_ID, id, {
        isActive: !current,
      });
      setPromoCodes((prev) =>
        prev.map((p) => (p.$id === id ? { ...p, isActive: !current } : p)),
      );
      notify(`Promo ${!current ? 'activated' : 'deactivated'}`);
    } catch {
      notify('Update failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  const deletePromo = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    setSaving(id);
    try {
      await databases.deleteDocument(DATABASE_ID, PROMO_TABLE_ID, id);
      setPromoCodes((prev) => prev.filter((p) => p.$id !== id));
      notify('Promo code deleted');
    } catch {
      notify('Delete failed', 'error');
    } finally {
      setSaving(null);
    }
  };

  const applyPromoToUser = async (userId, promo) => {
    setSaving(userId);
    try {
      const updates = {};
      promo.features?.forEach((key) => {
        updates[key] = true;
      });
      if (promo.trialDays > 0) {
        updates.trialEndsAt = daysFromNow(promo.trialDays);
        updates.plan = 'pro';
      }
      await databases.updateDocument(
        DATABASE_ID,
        USERS_TABLE_ID,
        userId,
        updates,
      );
      await databases.updateDocument(DATABASE_ID, PROMO_TABLE_ID, promo.$id, {
        usedCount: (promo.usedCount ?? 0) + 1,
      });
      await loadData();
      notify('Promo applied to user!');
    } catch {
      notify('Failed to apply promo', 'error');
    } finally {
      setSaving(null);
    }
  };

  const expireTrial = async (userId) => {
    if (!confirm('Expire this trial immediately and downgrade to Free?'))
      return;
    setSaving(userId);
    try {
      await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userId, {
        trialEndsAt: new Date().toISOString(),
        plan: 'free',
        hasJournalAccess: false,
        hasStrategiesAccess: false,
        hasBotAccess: false,
        hasAnalyticsAccess: false,
      });
      await loadData();
      notify('Trial expired');
    } catch {
      notify('Failed to expire trial', 'error');
    } finally {
      setSaving(null);
    }
  };

  const activePromos = promoCodes.filter(
    (p) => p.isActive && !isExpired(p.expiresAt),
  );
  const trialUsers = users.filter(
    (u) => u.trialEndsAt && new Date(u.trialEndsAt) > new Date(),
  );

  // Summary chip colours
  const chips = [
    {
      icon: Tag,
      label: 'Active Promos',
      value: activePromos.length,
      bg: T.accentLight,
      color: T.accentDark,
      iconColor: T.accent,
    },
    {
      icon: Clock,
      label: 'Active Trials',
      value: trialUsers.length,
      bg: '#e3f2fd',
      color: '#1565c0',
      iconColor: '#1976d2',
    },
    {
      icon: Users,
      label: 'Pro Users',
      value: users.filter((u) => u.plan === 'pro').length,
      bg: '#f3e5f5',
      color: '#6a1b9a',
      iconColor: '#7b1fa2',
    },
    {
      icon: Gift,
      label: 'Total Codes',
      value: promoCodes.length,
      bg: '#fff8e1',
      color: '#e65100',
      iconColor: '#f57c00',
    },
  ];

  return (
    <div style={{ fontFamily: 'inherit', color: T.text, position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.type === 'error' ? '#f8d7da' : '#d4edda',
            border: `1px solid ${toast.type === 'error' ? '#f5c6cb' : '#c3e6cb'}`,
            borderRadius: 10,
            padding: '12px 18px',
            fontSize: 13,
            fontWeight: 600,
            color: toast.type === 'error' ? '#721c24' : '#155724',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}
          >
            Plan Control
          </h2>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 13 }}>
            Manage promo codes, free trials, and plan feature access
          </p>
        </div>
        <button onClick={loadData} style={ghostBtn} title="Refresh">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Chips */}
      <div
        style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}
      >
        {chips.map(({ icon: Icon, label, value, bg, color, iconColor }) => (
          <div
            key={label}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: T.shadow,
              flex: '1 1 140px',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: bg,
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: T.text,
                }}
              >
                {value}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: T.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: `2px solid ${T.border}`,
          marginBottom: 24,
        }}
      >
        {[
          { id: 'promos', label: 'Promo Codes', icon: Tag },
          {
            id: 'trials',
            label: `Active Trials (${trialUsers.length})`,
            icon: Clock,
          },
          { id: 'plans', label: 'Plan Features', icon: Zap },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '10px 18px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom:
                tab === id ? `3px solid ${T.accent}` : '3px solid transparent',
              color: tab === id ? T.accent : T.textMuted,
              marginBottom: -2,
              transition: 'all 0.2s ease',
            }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Promo Codes ── */}
      {tab === 'promos' && (
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h3 style={sectionTitle}>
              <Tag size={16} style={{ color: T.accent }} /> Promo Codes
            </h3>
            <button onClick={() => setShowCreateModal(true)} style={primaryBtn}>
              + New Code
            </button>
          </div>

          {loading ? (
            <p
              style={{
                color: T.textMuted,
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              Loading…
            </p>
          ) : promoCodes.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 0',
                color: T.textLight,
              }}
            >
              <Tag size={40} style={{ marginBottom: 12, opacity: 0.25 }} />
              <p style={{ margin: 0, fontSize: 14 }}>
                No promo codes yet. Create your first one!
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9f9f9' }}>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    {['Code', 'Benefits', 'Usage', 'Expires', 'Active', ''].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '10px 16px',
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            color: T.textMuted,
                          }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <PromoRow
                      key={promo.$id}
                      promo={promo}
                      onToggle={togglePromo}
                      onDelete={deletePromo}
                      saving={saving}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {promoCodes.length > 0 && (
            <div
              style={{
                marginTop: 24,
                borderTop: `1px solid ${T.borderLight}`,
                paddingTop: 20,
              }}
            >
              <h4
                style={{
                  margin: '0 0 14px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.textMuted,
                }}
              >
                Manually Apply Promo to User
              </h4>
              <ManualApply
                users={users}
                promoCodes={promoCodes.filter(
                  (p) => p.isActive && !isExpired(p.expiresAt),
                )}
                onApply={applyPromoToUser}
                saving={saving}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Active Trials ── */}
      {tab === 'trials' && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            <Clock size={16} style={{ color: '#1976d2' }} /> Active Free Trials
          </h3>
          <ActiveTrials
            users={users}
            onExpireNow={expireTrial}
            saving={saving}
          />
        </div>
      )}

      {/* ── Tab: Plan Features ── */}
      {tab === 'plans' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
              Configure default features per plan. Changes here update new users
              — use Feature Flags for individuals.
            </p>
            {!editingPlans ? (
              <button onClick={() => setEditingPlans(true)} style={ghostBtn}>
                <Edit2 size={14} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditingPlans(false)} style={ghostBtn}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setEditingPlans(false);
                    notify('Plan config saved (local reference)');
                  }}
                  style={primaryBtn}
                >
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </div>

          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          >
            {plans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  ...cardStyle,
                  borderTop: `3px solid ${plan.id === 'pro' ? T.accent : '#90caf9'}`,
                  background:
                    plan.id === 'pro'
                      ? 'linear-gradient(135deg, rgba(76,175,80,0.04) 0%, #fff 100%)'
                      : T.card,
                  marginBottom: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: `1px solid ${T.borderLight}`,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontWeight: 700,
                      fontSize: 18,
                      color: T.text,
                    }}
                  >
                    {plan.name}
                  </h3>
                  <div
                    style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}
                  >
                    {editingPlans ? (
                      <input
                        type="number"
                        value={plan.price}
                        onChange={(e) =>
                          setPlans((prev) =>
                            prev.map((p) =>
                              p.id === plan.id
                                ? {
                                    ...p,
                                    price: parseFloat(e.target.value) || 0,
                                  }
                                : p,
                            ),
                          )
                        }
                        style={{
                          ...inputStyle,
                          width: 80,
                          fontSize: 20,
                          fontWeight: 700,
                          color: T.accent,
                          textAlign: 'right',
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 28,
                          fontWeight: 700,
                          color: T.accent,
                        }}
                      >
                        ${plan.price}
                      </span>
                    )}
                    <span style={{ color: T.textMuted, fontSize: 13 }}>
                      /{plan.billingCycle}
                    </span>
                  </div>
                </div>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {ALL_FEATURES.map((f) => (
                    <div
                      key={f.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: '#f9f9f9',
                        borderRadius: 8,
                        border: `1px solid ${T.borderLight}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          color: plan.features[f.key] ? T.text : T.textLight,
                          fontWeight: plan.features[f.key] ? 500 : 400,
                        }}
                      >
                        {f.label}
                      </span>
                      {editingPlans ? (
                        <Toggle
                          checked={plan.features[f.key]}
                          onChange={() =>
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.id === plan.id
                                  ? {
                                      ...p,
                                      features: {
                                        ...p.features,
                                        [f.key]: !p.features[f.key],
                                      },
                                    }
                                  : p,
                              ),
                            )
                          }
                        />
                      ) : plan.features[f.key] ? (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#c8e6c9',
                            color: '#2e7d32',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={13} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#ffcdd2',
                            color: '#c62828',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <X size={13} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    borderTop: `1px solid ${T.borderLight}`,
                    paddingTop: 14,
                  }}
                >
                  <p style={{ ...labelStyle, marginBottom: 10 }}>
                    Usage Limits
                  </p>
                  {[
                    { key: 'maxJournalEntries', label: 'Journal Entries' },
                    { key: 'maxStrategies', label: 'Strategies' },
                    { key: 'maxBots', label: 'Bots' },
                  ].map(({ key, label }) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, color: T.textMuted }}>
                        {label}
                      </span>
                      {editingPlans ? (
                        <input
                          type="number"
                          min="-1"
                          value={plan.limits[key]}
                          onChange={(e) =>
                            setPlans((prev) =>
                              prev.map((p) =>
                                p.id === plan.id
                                  ? {
                                      ...p,
                                      limits: {
                                        ...p.limits,
                                        [key]: parseInt(e.target.value) || 0,
                                      },
                                    }
                                  : p,
                              ),
                            )
                          }
                          style={{
                            ...inputStyle,
                            width: 70,
                            textAlign: 'right',
                            padding: '5px 8px',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            color: T.text,
                            fontWeight: 600,
                          }}
                        >
                          {plan.limits[key] === -1 ? '∞' : plan.limits[key]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              background: '#e3f2fd',
              border: '1px solid #90caf9',
              borderRadius: T.radiusSm,
              padding: '12px 16px',
              fontSize: 13,
              color: '#1565c0',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              Plan features here are a <strong>reference configuration</strong>.
              Actual enforcement is done via <strong>User Management</strong>{' '}
              (upgrade/downgrade) and <strong>Feature Flags</strong>.
            </span>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreatePromoModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createPromo}
        />
      )}
    </div>
  );
};

export default PlanControl;
