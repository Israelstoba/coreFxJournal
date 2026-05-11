import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaTrophy,
  FaChartLine,
  FaExclamationTriangle,
  FaBan,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaTrash,
  FaRedo,
  FaSyncAlt,
  FaShieldAlt,
  FaBullseye,
  FaFire,
} from 'react-icons/fa';
import '@/styles/dashboard/_propsimulator.scss';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAIRS = [
  'XAU/USD',
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'NZD/USD',
  'USD/CAD',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'GBP/AUD',
  'AUD/JPY',
  'EUR/AUD',
  'EUR/CAD',
  'US30',
  'NAS100',
  'SPX500',
  'BTC/USD',
  'USOIL',
];
const SESSIONS = ['London', 'New York', 'Asian', 'London/NY Overlap'];

const PHASE_PRESETS = {
  1: { profitTarget: 8, maxDD: 10, dailyLoss: 5 },
  2: { profitTarget: 5, maxDD: 5, dailyLoss: 4 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  '$' +
  Math.abs(Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtSigned = (n) => {
  const abs = fmtUSD(n);
  return n >= 0 ? `+${abs}` : `-${abs}`;
};

const fmtPct = (n, d = 2) => `${Number(n).toFixed(d)}%`;

const today = () => new Date().toISOString().slice(0, 10);

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    safe: { cls: 'badge--safe', icon: <FaCheckCircle />, label: 'On Track' },
    warn_day: {
      cls: 'badge--warn',
      icon: <FaExclamationTriangle />,
      label: 'Near Daily Limit',
    },
    warn_dd: {
      cls: 'badge--warn',
      icon: <FaExclamationTriangle />,
      label: 'Near DD Limit',
    },
    stop_day: {
      cls: 'badge--danger',
      icon: <FaBan />,
      label: 'Daily Limit Hit',
    },
    fail: {
      cls: 'badge--fail',
      icon: <FaTimesCircle />,
      label: 'Account Failed',
    },
    pass: {
      cls: 'badge--pass',
      icon: <FaTrophy />,
      label: 'Challenge Passed!',
    },
  };
  const { cls, icon, label } = map[status] || map.safe;
  return (
    <span className={`ps-badge ${cls}`}>
      {icon} {label}
    </span>
  );
};

const MetricCard = ({ label, value, sub, valueClass = '' }) => (
  <div className="ps-metric">
    <span className="ps-metric__label">{label}</span>
    <span className={`ps-metric__value ${valueClass}`}>{value}</span>
    {sub && <span className="ps-metric__sub">{sub}</span>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PropSimulator = () => {
  // ── Settings state ──
  const [phase, setPhase] = useState(1);
  const [startBal, setStartBal] = useState(2000);
  const [profitPct, setProfitPct] = useState(8); // %
  const [maxDD, setMaxDD] = useState(10); // %
  const [dailyLoss, setDailyLoss] = useState(5); // %
  const [riskPct, setRiskPct] = useState(1); // % per trade
  const [rrRatio, setRrRatio] = useState(1); // R:R
  const [winRate, setWinRate] = useState(50); // % (for projections)

  // ── Trade log ──
  const [trades, setTrades] = useState([]);

  // ── Derived live stats (computed in recalc) ──
  const [stats, setStats] = useState({});

  // ─────────────────────────────────────────────────────────────────────────
  // Core recalculation
  // ─────────────────────────────────────────────────────────────────────────
  const recalc = useCallback(() => {
    const sb = parseFloat(startBal) || 100000;
    const ppct = parseFloat(profitPct) / 100 || 0.08;
    const ddMax = parseFloat(maxDD) / 100 || 0.1;
    const dlMax = parseFloat(dailyLoss) / 100 || 0.05;
    const rpct = parseFloat(riskPct) / 100 || 0.02;
    const rr = parseFloat(rrRatio) || 3;

    const target = sb * (1 + ppct);

    // Walk through trades, computing balance and DD
    let bal = sb;
    let highWater = sb;

    const resolved = trades.map((t) => {
      if (!t.outcome || t.outcome === 'pending') {
        return { ...t, pl: null, balance: null, ddPct: null };
      }
      const tradeRiskPct = t.riskPct != null ? t.riskPct / 100 : rpct;
      const riskUsd = tradeRiskPct * bal;
      let pl = 0;
      if (t.outcome === 'win') pl = riskUsd * rr;
      else if (t.outcome === 'loss') pl = -riskUsd;
      else if (t.outcome === 'be') pl = 0;

      bal += pl;
      if (bal > highWater) highWater = bal;
      const dd = (highWater - bal) / sb;

      return { ...t, riskUsd, pl, balance: bal, ddPct: dd };
    });

    // Today's P/L
    const todayStr = today();
    const dailyPL = resolved
      .filter((t) => t.date === todayStr && typeof t.pl === 'number')
      .reduce((s, t) => s + t.pl, 0);

    const activeBal =
      resolved.filter((t) => t.balance != null).pop()?.balance ?? sb;
    const activeDd = resolved.filter((t) => t.ddPct != null).pop()?.ddPct ?? 0;
    const ddLeft = ddMax * sb - activeDd * sb;
    const toTarget = Math.max(0, target - activeBal);
    const balPct = Math.min(
      100,
      Math.max(0, ((activeBal - sb) / (target - sb)) * 100),
    );

    // Status logic
    let status = 'safe';
    if (activeBal >= target) status = 'pass';
    else if (activeDd >= ddMax) status = 'fail';
    else if (dailyPL <= -(dlMax * sb)) status = 'stop_day';
    else if (activeDd >= ddMax * 0.9) status = 'warn_dd';
    else if (dailyPL <= -(dlMax * sb * 0.8)) status = 'warn_day';

    // Suggested risk for next trade (capped by limits)
    const maxByDD = Math.max(0, ddLeft / activeBal);
    const maxByDay = Math.max(0, (dlMax * sb + dailyPL) / activeBal);
    const suggestedR = Math.min(rpct, maxByDD, maxByDay);
    const suggestedUSD = suggestedR * activeBal;

    // Stats
    const wins = resolved.filter((t) => t.outcome === 'win').length;
    const losses = resolved.filter((t) => t.outcome === 'loss').length;
    const bes = resolved.filter((t) => t.outcome === 'be').length;
    const total = wins + losses;
    const wr = total > 0 ? ((wins / total) * 100).toFixed(0) + '%' : '—';

    // Expected return (risk% × RR) vs expected loss (risk% × (1-wr))
    const wr_n = parseFloat(winRate) / 100;
    const ev = rpct * rr * wr_n - rpct * (1 - wr_n);

    setStats({
      activeBal,
      target,
      toTarget,
      ddLeft,
      ddPct: activeDd * 100,
      dailyPL,
      balPct,
      status,
      wins,
      losses,
      bes,
      wr,
      suggestedR: suggestedR * 100,
      suggestedUSD,
      ev: ev * 100,
      sb,
      resolved,
    });
  }, [
    startBal,
    profitPct,
    maxDD,
    dailyLoss,
    riskPct,
    rrRatio,
    winRate,
    trades,
  ]);

  useEffect(() => {
    recalc();
  }, [recalc]);

  // ── Phase switch ──
  const handlePhaseChange = (p) => {
    setPhase(p);
    const preset = PHASE_PRESETS[p];
    setProfitPct(preset.profitTarget);
    setMaxDD(preset.maxDD);
    setDailyLoss(preset.dailyLoss);
  };

  // ── Trade actions ──
  const addTrade = () => {
    setTrades((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: today(),
        pair: 'GBP/USD',
        session: 'London',
        outcome: 'pending',
        riskPct: null,
        notes: '',
      },
    ]);
  };

  const updateTrade = (id, key, val) => {
    setTrades((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: val } : t)),
    );
  };

  const removeTrade = (id) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const resetAll = () => {
    setTrades([]);
    setPhase(1);
    setStartBal(2000);
    setProfitPct(8);
    setMaxDD(10);
    setDailyLoss(5);
    setRiskPct(1);
    setRrRatio(1);
    setWinRate(50);
  };

  // Projected trades to pass (rough estimate)
  const tradesToPass =
    stats.toTarget > 0 && stats.suggestedUSD > 0
      ? Math.ceil(
          stats.toTarget / (stats.suggestedUSD * (parseFloat(rrRatio) || 3)),
        )
      : 0;

  return (
    <div className="prop-simulator">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="ps-page-header">
        <div className="ps-page-header__left">
          <h1 className="ps-page-header__title">
            <FaBullseye className="ps-page-header__icon" />
            Corepips Prop Simulator
          </h1>
          <p className="ps-page-header__sub">
            Golden Bullet Strategy — size every trade to pass your challenge
          </p>
        </div>
        <button className="ps-btn ps-btn--ghost ps-btn--sm" onClick={resetAll}>
          <FaRedo /> Reset
        </button>
      </div>

      {/* ── Top row: Settings + Dashboard ────────────────────────────────── */}
      <div className="ps-top-row">
        {/* Settings card */}
        <div className="ps-card">
          <div className="ps-card__header">
            <FaBullseye className="ps-card__header-icon" />
            <span>Account Info</span>
          </div>

          {/* Phase toggle */}
          <div className="ps-field">
            <label className="ps-label">Challenge phase</label>
            <div className="ps-phase-toggle">
              {[1, 2].map((p) => (
                <button
                  key={p}
                  className={`ps-phase-btn${phase === p ? ' active' : ''}`}
                  onClick={() => handlePhaseChange(p)}
                >
                  Phase {p}
                </button>
              ))}
            </div>
          </div>

          {/* Starting balance */}
          <div className="ps-field">
            <label className="ps-label">Starting balance ($)</label>
            <input
              className="ps-input"
              type="number"
              value={startBal}
              onChange={(e) => setStartBal(e.target.value)}
            />
          </div>

          <div className="ps-field-row">
            <div className="ps-field">
              <label className="ps-label">Profit target (%)</label>
              <input
                className="ps-input"
                type="number"
                value={profitPct}
                step="0.5"
                onChange={(e) => setProfitPct(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <label className="ps-label">Max drawdown (%)</label>
              <input
                className="ps-input"
                type="number"
                value={maxDD}
                step="0.5"
                onChange={(e) => setMaxDD(e.target.value)}
              />
            </div>
          </div>

          <div className="ps-field-row">
            <div className="ps-field">
              <label className="ps-label">Max daily loss (%)</label>
              <input
                className="ps-input"
                type="number"
                value={dailyLoss}
                step="0.5"
                onChange={(e) => setDailyLoss(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <label className="ps-label">Win rate (%)</label>
              <input
                className="ps-input"
                type="number"
                value={winRate}
                step="5"
                min="0"
                max="100"
                onChange={(e) => setWinRate(e.target.value)}
              />
            </div>
          </div>

          <div className="ps-divider" />

          {/* RR & Risk — the two core controls */}
          <p className="ps-section-label">Trade parameters</p>

          <div className="ps-field-row">
            <div className="ps-field">
              <label className="ps-label">Risk per trade (%)</label>
              <input
                className="ps-input ps-input--highlight"
                type="number"
                value={riskPct}
                step="0.1"
                min="0.1"
                max="10"
                onChange={(e) => setRiskPct(e.target.value)}
              />
            </div>
            <div className="ps-field">
              <label className="ps-label">R:R ratio</label>
              <input
                className="ps-input ps-input--highlight"
                type="number"
                value={rrRatio}
                step="0.5"
                min="0.5"
                onChange={(e) => setRrRatio(e.target.value)}
              />
            </div>
          </div>

          {/* EV pill */}
          <div
            className={`ps-ev-pill${stats.ev >= 0 ? ' ps-ev-pill--pos' : ' ps-ev-pill--neg'}`}
          >
            <FaFire />
            <span>
              Expected value per trade:&nbsp;
              <strong>{stats.ev != null ? fmtPct(stats.ev) : '—'}</strong>
              &nbsp;of account per trade at {winRate}% WR
            </span>
          </div>
        </div>

        {/* Live Dashboard card */}
        <div className="ps-card ps-card--dashboard">
          <div className="ps-card__header">
            <FaChartLine className="ps-card__header-icon" />
            <span>Live Dashboard</span>
            <StatusBadge status={stats.status || 'safe'} />
          </div>

          {/* Balance progress */}
          <div className="ps-balance-section">
            <div className="ps-balance-row">
              <span className="ps-balance-label">Balance</span>
              <span className="ps-balance-value">
                {fmtUSD(stats.activeBal)}
              </span>
            </div>
            <div className="ps-progress-wrap">
              <div
                className="ps-progress-fill"
                style={{ width: `${stats.balPct || 0}%` }}
              />
            </div>
            <div className="ps-balance-row ps-balance-row--sm">
              <span>{fmtUSD(stats.activeBal)}</span>
              <span className="ps-target-label">
                Overall Target: {fmtUSD(stats.target)}
              </span>
            </div>
          </div>

          {/* Metric grid */}
          <div className="ps-metrics-grid">
            <MetricCard
              label="Profit Target"
              value={fmtUSD(stats.toTarget)}
              valueClass={stats.toTarget === 0 ? 'green' : ''}
            />
            <MetricCard
              label="Max DD Left"
              value={fmtUSD(stats.ddLeft)}
              sub={`${fmtPct(stats.ddPct || 0)} used`}
              valueClass={
                stats.ddLeft < (maxDD / 100) * startBal * 0.2
                  ? 'red'
                  : stats.ddLeft < (maxDD / 100) * startBal * 0.5
                    ? 'amber'
                    : 'green'
              }
            />
            <MetricCard
              label="Daily P/L"
              value={stats.dailyPL != null ? fmtSigned(stats.dailyPL) : '$0.00'}
              valueClass={
                stats.dailyPL > 0 ? 'green' : stats.dailyPL < 0 ? 'red' : ''
              }
            />
            <MetricCard
              label="Drawdown"
              value={fmtPct(stats.ddPct || 0)}
              valueClass={
                stats.ddPct > 7 ? 'red' : stats.ddPct > 4 ? 'amber' : ''
              }
            />
          </div>

          {/* Win/loss strip */}
          <div className="ps-wl-strip">
            <span className="ps-wl-item ps-wl-item--w">
              W <strong>{stats.wins || 0}</strong>
            </span>
            <span className="ps-wl-item ps-wl-item--l">
              L <strong>{stats.losses || 0}</strong>
            </span>
            <span className="ps-wl-item ps-wl-item--be">
              BE <strong>{stats.bes || 0}</strong>
            </span>
            <span className="ps-wl-item">
              Win Rate <strong>{stats.wr || '—'}</strong>
            </span>
          </div>

          {/* Next trade suggestion */}
          <div
            className={`ps-next-trade${
              stats.status === 'fail' || stats.status === 'stop_day'
                ? ' ps-next-trade--blocked'
                : stats.suggestedR < parseFloat(riskPct)
                  ? ' ps-next-trade--warn'
                  : ''
            }`}
          >
            <div className="ps-next-trade__header">
              Next trade risk suggestion
            </div>
            <div className="ps-next-trade__main">
              <span className="ps-next-trade__pct">
                {fmtPct(stats.suggestedR || 0)}
              </span>
              <span className="ps-next-trade__usd">
                = {fmtUSD(stats.suggestedUSD)}
              </span>
            </div>
            <div className="ps-next-trade__detail">
              A Win @ {rrRatio}R ={' '}
              <strong className="green">
                {fmtUSD((stats.suggestedUSD || 0) * (parseFloat(rrRatio) || 3))}
              </strong>
              &nbsp;| &nbsp; A Loss ={' '}
              <strong className="red">
                −{fmtUSD(stats.suggestedUSD || 0)}
              </strong>
              &nbsp;·&nbsp; ~{tradesToPass} trade{tradesToPass !== 1 ? 's' : ''}{' '}
              to pass
            </div>
          </div>
        </div>
      </div>

      {/* ── Trade Log ───────────────────────────────────────────────────── */}
      <div className="ps-card ps-card--log">
        <div className="ps-card__header">
          <FaChartLine className="ps-card__header-icon" />
          <span>Trade Log</span>
          <button
            className="ps-btn ps-btn--primary ps-btn--sm"
            onClick={addTrade}
          >
            <FaPlus /> Add Trade
          </button>
        </div>

        {trades.length === 0 ? (
          <div className="ps-log-empty">
            <FaChartLine className="ps-log-empty__icon" />
            <p>
              No trades yet — click <strong>Add Trade</strong> to start logging
            </p>
          </div>
        ) : (
          <div className="ps-table-wrap">
            <table className="ps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Pair</th>
                  <th>Session</th>
                  <th>Outcome</th>
                  <th>Risk %</th>
                  <th>Risk $</th>
                  <th>P/L</th>
                  <th>Balance</th>
                  <th>DD%</th>
                  <th>To Target</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(stats.resolved || trades).map((t, i) => {
                  const rUsd = t.riskUsd;
                  const plVal = t.pl;
                  const resolved =
                    stats.resolved?.find((r) => r.id === t.id) || t;
                  const tradeStatus =
                    resolved.balance != null
                      ? resolved.ddPct >= parseFloat(maxDD) / 100
                        ? 'fail'
                        : resolved.balance >=
                            parseFloat(startBal) *
                              (1 + parseFloat(profitPct) / 100)
                          ? 'pass'
                          : resolved.ddPct >= (parseFloat(maxDD) / 100) * 0.9
                            ? 'warn_dd'
                            : 'safe'
                      : null;

                  return (
                    <tr key={t.id}>
                      <td className="ps-table__num">{i + 1}</td>
                      <td>
                        <input
                          type="date"
                          className="ps-table-input"
                          value={t.date || ''}
                          onChange={(e) =>
                            updateTrade(t.id, 'date', e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="ps-table-select"
                          value={t.pair}
                          onChange={(e) =>
                            updateTrade(t.id, 'pair', e.target.value)
                          }
                        >
                          {PAIRS.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="ps-table-select"
                          value={t.session}
                          onChange={(e) =>
                            updateTrade(t.id, 'session', e.target.value)
                          }
                        >
                          {SESSIONS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className={`ps-outcome-select ps-outcome-select--${t.outcome || 'pending'}`}
                          value={t.outcome || 'pending'}
                          onChange={(e) =>
                            updateTrade(t.id, 'outcome', e.target.value)
                          }
                        >
                          <option value="pending">— Select —</option>
                          <option value="win">Win</option>
                          <option value="loss">Loss</option>
                          <option value="be">BE</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="ps-table-input ps-table-input--sm"
                          value={t.riskPct != null ? t.riskPct : riskPct}
                          step="0.1"
                          onChange={(e) =>
                            updateTrade(
                              t.id,
                              'riskPct',
                              parseFloat(e.target.value),
                            )
                          }
                        />
                      </td>
                      <td className="ps-table__mono">
                        {rUsd != null ? fmtUSD(rUsd) : '—'}
                      </td>
                      <td
                        className={`ps-table__mono${plVal > 0 ? ' green' : plVal < 0 ? ' red' : ''}`}
                      >
                        {typeof plVal === 'number' ? fmtSigned(plVal) : '—'}
                      </td>
                      <td className="ps-table__mono">
                        {resolved.balance != null
                          ? fmtUSD(resolved.balance)
                          : '—'}
                      </td>
                      <td
                        className={`ps-table__mono${resolved.ddPct > 0.07 ? ' red' : resolved.ddPct > 0.04 ? ' amber' : ''}`}
                      >
                        {resolved.ddPct != null
                          ? fmtPct(resolved.ddPct * 100)
                          : '—'}
                      </td>
                      <td className="ps-table__mono">
                        {resolved.balance != null
                          ? fmtUSD(
                              Math.max(
                                0,
                                parseFloat(startBal) *
                                  (1 + parseFloat(profitPct) / 100) -
                                  resolved.balance,
                              ),
                            )
                          : '—'}
                      </td>
                      <td>
                        {tradeStatus && <StatusBadge status={tradeStatus} />}
                      </td>
                      <td>
                        <button
                          className="ps-table-delete"
                          onClick={() => removeTrade(t.id)}
                          title="Remove trade"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Tips ─────────────────────────────────────────────────────────── */}
      <div className="ps-tips">
        <span className="ps-tips__title">Tips</span>
        <span>
          Use <strong>−1</strong> for unlimited &nbsp;·&nbsp;
        </span>
        <span>
          Risk is capped at the smaller of DD remaining or daily loss remaining
          &nbsp;·&nbsp;
        </span>
        <span>BE trades protect balance while keeping you active</span>
      </div>
    </div>
  );
};

export default PropSimulator;
