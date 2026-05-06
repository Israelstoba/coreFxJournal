import React, { useState, useEffect } from 'react';
import { databases } from '../../lib/appwrite';
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_TABLE_ID;
const PAYMENTS_TABLE_ID = import.meta.env.VITE_APPWRITE_PAYMENTS_TABLE_ID;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, decimals = 2) =>
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

const startOf = (period) => {
  const d = new Date();
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth(), 1);
  if (period === 'lastMonth')
    return new Date(d.getFullYear(), d.getMonth() - 1, 1);
  if (period === 'endOfLastMonth')
    return new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59);
  if (period === 'year') return new Date(d.getFullYear(), 0, 1);
  return d;
};

const pctChange = (now, then) =>
  then === 0 ? (now > 0 ? 100 : 0) : ((now - then) / then) * 100;

// ─── Admin theme tokens ────────────────────────────────────────────────────────
const T = {
  bg: '#f5f5f5',
  card: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f0f0f0',
  accent: '#4caf50',
  accentHover: '#45a049',
  accentLight: '#e8f5e9',
  text: '#1a1a1a',
  textMuted: '#666',
  textLight: '#999',
  shadow: '0 2px 8px rgba(0,0,0,0.1)',
  radius: '12px',
  // Semantic colours for KPI icons (match admin stat-card classes)
  blue: { bg: '#e3f2fd', color: '#1976d2' },
  green: { bg: '#e8f5e9', color: '#388e3c' },
  gold: { bg: '#fff8e1', color: '#f57c00' },
  purple: { bg: '#f3e5f5', color: '#7b1fa2' },
  teal: { bg: '#e0f2f1', color: '#00796b' },
  red: { bg: '#ffebee', color: '#d32f2f' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Trend = ({ value }) =>
  value === null ? null : (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        marginTop: 4,
        color: value >= 0 ? T.accent : '#f44336',
      }}
    >
      {value >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(value).toFixed(1)}% vs last month
    </div>
  );

const KPI = ({
  icon: Icon,
  label,
  value,
  trend = null,
  iconTheme = 'green',
}) => {
  const theme = T[iconTheme] || T.green;
  return (
    <div
      style={{
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius,
        padding: '20px 22px',
        boxShadow: T.shadow,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: theme.bg,
          color: theme.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={22} />
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, color: T.textMuted }}>{label}</p>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 26,
            fontWeight: 700,
            color: T.text,
          }}
        >
          {value}
        </p>
        <Trend value={trend} />
      </div>
    </div>
  );
};

const statusIcon = (status) => {
  if (['success', 'paid', 'completed'].includes(status))
    return <CheckCircle size={13} style={{ color: T.accent }} />;
  if (['failed', 'cancelled'].includes(status))
    return <XCircle size={13} style={{ color: '#f44336' }} />;
  return <Clock size={13} style={{ color: '#f57c00' }} />;
};

const statusColor = (s) => {
  if (['success', 'paid', 'completed'].includes(s)) return T.accent;
  if (['failed', 'cancelled'].includes(s)) return '#f44336';
  return '#f57c00';
};

const statusBg = (s) => {
  if (['success', 'paid', 'completed'].includes(s)) return '#d4edda';
  if (['failed', 'cancelled'].includes(s)) return '#f8d7da';
  return '#fff3cd';
};

const statusTextColor = (s) => {
  if (['success', 'paid', 'completed'].includes(s)) return '#155724';
  if (['failed', 'cancelled'].includes(s)) return '#721c24';
  return '#856404';
};

// ─── Range button ─────────────────────────────────────────────────────────────
const RangeBtn = ({ id, label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: active ? T.accent : T.card,
      border: `1px solid ${active ? T.accent : T.border}`,
      borderRadius: 8,
      padding: '6px 14px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      color: active ? '#fff' : T.textMuted,
      transition: 'all 0.2s ease',
    }}
  >
    {label}
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const Revenue = () => {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('month');
  const [kpis, setKpis] = useState({});
  const [monthly, setMonthly] = useState([]);

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (payments.length > 0 || !loading) compute();
  }, [payments, users, range]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payRes, userRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, PAYMENTS_TABLE_ID),
        databases.listDocuments(DATABASE_ID, USERS_TABLE_ID),
      ]);
      setPayments(payRes.documents);
      setUsers(userRes.documents);
    } catch (err) {
      console.error('Revenue load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const successfulPayments = (list) =>
    list.filter((p) =>
      ['success', 'paid', 'completed'].includes((p.status || '').toLowerCase()),
    );

  const compute = () => {
    const now = new Date();
    const thisMonthStart = startOf('month');
    const lastMonthStart = startOf('lastMonth');
    const lastMonthEnd = startOf('endOfLastMonth');
    const yearStart = startOf('year');
    const paid = successfulPayments(payments);

    const inRange = (p) => {
      const d = new Date(p.paidAt || p.createdAt);
      if (range === 'month') return d >= thisMonthStart;
      if (range === 'year') return d >= yearStart;
      return true;
    };

    const thisMonthPaid = paid.filter(
      (p) => new Date(p.paidAt || p.createdAt) >= thisMonthStart,
    );
    const lastMonthPaid = paid.filter((p) => {
      const d = new Date(p.paidAt || p.createdAt);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });

    const mrr = thisMonthPaid.reduce((s, p) => s + (p.amount || 0), 0);
    const lmr = lastMonthPaid.reduce((s, p) => s + (p.amount || 0), 0);
    const totalRevenue = paid
      .filter(inRange)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const proUsers = users.filter((u) => u.plan === 'pro');
    const arpu = proUsers.length > 0 ? mrr / proUsers.length : 0;

    const thisMonthSubs = proUsers.filter(
      (u) => u.planUpdatedAt && new Date(u.planUpdatedAt) >= thisMonthStart,
    ).length;
    const lastMonthSubs = users.filter(
      (u) =>
        u.plan === 'pro' &&
        u.planUpdatedAt &&
        new Date(u.planUpdatedAt) >= lastMonthStart &&
        new Date(u.planUpdatedAt) <= lastMonthEnd,
    ).length;

    setKpis({
      mrr,
      mrrTrend: pctChange(mrr, lmr),
      arr: mrr * 12,
      totalRevenue,
      subscribers: proUsers.length,
      subTrend: pctChange(thisMonthSubs, lastMonthSubs),
      arpu,
      totalTx: paid.filter(inRange).length,
    });

    const bars = [];
    for (let i = 5; i >= 0; i--) {
      const mo = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );
      const label = mo.toLocaleString('default', { month: 'short' });
      const rev = paid
        .filter((p) => {
          const d = new Date(p.paidAt || p.createdAt);
          return d >= mo && d <= moEnd;
        })
        .reduce((s, p) => s + (p.amount || 0), 0);
      bars.push({ label, rev });
    }
    setMonthly(bars);
  };

  const recentPaid = successfulPayments(payments)
    .sort(
      (a, b) =>
        new Date(b.paidAt || b.createdAt) - new Date(a.paidAt || a.createdAt),
    )
    .slice(0, 8);

  const maxBarRev = Math.max(...monthly.map((b) => b.rev), 1);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          color: T.textMuted,
        }}
      >
        <RefreshCw size={20} style={{ marginRight: 10 }} />
        Loading revenue data…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'inherit', color: T.text }}>
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
            Revenue
          </h2>
          <p style={{ margin: '4px 0 0', color: T.textMuted, fontSize: 13 }}>
            Live data from your payments collection
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <RangeBtn
            id="month"
            label="This Month"
            active={range === 'month'}
            onClick={() => setRange('month')}
          />
          <RangeBtn
            id="year"
            label="This Year"
            active={range === 'year'}
            onClick={() => setRange('year')}
          />
          <RangeBtn
            id="all"
            label="All Time"
            active={range === 'all'}
            onClick={() => setRange('all')}
          />
          <button
            onClick={loadData}
            style={{
              background: T.card,
              border: `2px solid ${T.border}`,
              borderRadius: 8,
              padding: '6px 12px',
              color: T.accent,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: 600,
              fontSize: 13,
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KPI
          icon={DollarSign}
          label="MRR"
          value={`$${fmt(kpis.mrr)}`}
          trend={kpis.mrrTrend}
          iconTheme="green"
        />
        <KPI
          icon={TrendingUp}
          label="ARR"
          value={`$${fmt(kpis.arr)}`}
          iconTheme="blue"
        />
        <KPI
          icon={DollarSign}
          label={
            range === 'month'
              ? 'Monthly Revenue'
              : range === 'year'
                ? 'YTD Revenue'
                : 'Total Revenue'
          }
          value={`$${fmt(kpis.totalRevenue)}`}
          iconTheme="purple"
        />
        <KPI
          icon={Users}
          label="Pro Subscribers"
          value={kpis.subscribers}
          trend={kpis.subTrend}
          iconTheme="gold"
        />
        <KPI
          icon={CreditCard}
          label="ARPU"
          value={`$${fmt(kpis.arpu)}`}
          iconTheme="teal"
        />
        <KPI
          icon={CheckCircle}
          label="Transactions"
          value={kpis.totalTx}
          iconTheme="green"
        />
      </div>

      {/* Chart + Recent Transactions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.4fr',
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Bar Chart */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
            padding: 24,
            boxShadow: T.shadow,
          }}
        >
          <h3
            style={{
              margin: '0 0 20px',
              fontSize: 15,
              fontWeight: 600,
              color: T.text,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Calendar size={15} style={{ color: T.accent }} /> 6-Month Revenue
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 10,
              height: 140,
            }}
          >
            {monthly.map(({ label, rev }) => {
              const pct = (rev / maxBarRev) * 100;
              const isCurrent =
                label ===
                new Date().toLocaleString('default', { month: 'short' });
              return (
                <div
                  key={label}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: T.textMuted,
                      fontWeight: 600,
                    }}
                  >
                    {rev > 0 ? `$${fmt(rev, 0)}` : ''}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(pct, rev > 0 ? 4 : 0)}%`,
                      background: isCurrent ? T.accent : '#e8f5e9',
                      borderRadius: '4px 4px 0 0',
                      minHeight: rev > 0 ? 4 : 0,
                      transition: 'height 0.4s ease',
                      border: isCurrent ? 'none' : `1px solid ${T.border}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: isCurrent ? T.accent : T.textMuted,
                      fontWeight: isCurrent ? 700 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {payments.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: T.textLight,
                fontSize: 12,
                marginTop: 16,
              }}
            >
              No payment data yet
            </p>
          )}
        </div>

        {/* Recent Transactions */}
        <div
          style={{
            background: T.card,
            border: `1px solid ${T.border}`,
            borderRadius: T.radius,
            padding: 24,
            boxShadow: T.shadow,
            overflow: 'hidden',
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: 15,
              fontWeight: 600,
              color: T.text,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CreditCard size={15} style={{ color: T.accent }} /> Recent Payments
          </h3>
          {recentPaid.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 0',
                color: T.textLight,
              }}
            >
              <CreditCard size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 13 }}>
                No successful payments yet
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentPaid.map((p) => {
                const user = users.find(
                  (u) => u.$id === p.userId || u.userId === p.userId,
                );
                return (
                  <div
                    key={p.$id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f9f9f9',
                      border: `1px solid ${T.borderLight}`,
                      borderRadius: 8,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      {statusIcon(p.status)}
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 600,
                            color: T.text,
                          }}
                        >
                          {user?.name ||
                            user?.email ||
                            p.userId?.slice(0, 8) ||
                            'Unknown'}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            color: T.textMuted,
                          }}
                        >
                          {new Date(
                            p.paidAt || p.createdAt,
                          ).toLocaleDateString()}{' '}
                          · {p.provider || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: T.accent,
                        }}
                      >
                        ${fmt(p.amount)}
                      </p>
                      <span
                        style={{
                          display: 'inline-block',
                          marginTop: 2,
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: statusBg(p.status),
                          color: statusTextColor(p.status),
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Status Breakdown */}
      <div
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius,
          padding: 24,
          boxShadow: T.shadow,
        }}
      >
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 600,
            color: T.text,
          }}
        >
          Payment Status Breakdown
        </h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {['success', 'pending', 'failed'].map((status) => {
            const group = payments.filter((p) =>
              ['success', 'paid', 'completed'].includes(status)
                ? ['success', 'paid', 'completed'].includes(
                    (p.status || '').toLowerCase(),
                  )
                : (p.status || '').toLowerCase() === status,
            );
            const total = group.reduce((s, p) => s + (p.amount || 0), 0);
            return (
              <div
                key={status}
                style={{
                  flex: 1,
                  minWidth: 130,
                  background: statusBg(status),
                  border: `1px solid ${statusColor(status)}33`,
                  borderRadius: 10,
                  padding: '16px 18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  {statusIcon(status)}
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: statusTextColor(status),
                    }}
                  >
                    {status}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 700,
                    color: T.text,
                  }}
                >
                  {group.length}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>
                  ${fmt(total)} total
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Revenue;
