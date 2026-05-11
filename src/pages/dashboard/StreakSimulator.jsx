// src/pages/dashboard/StreakSimulator.jsx
import React, { useState, useMemo } from 'react';
import {
  FaFire,
  FaRedo,
  FaBullseye,
  FaChartLine,
  FaTrophy,
  FaInfoCircle,
} from 'react-icons/fa';
import '@/styles/dashboard/_streaksimulator.scss';
import StreakDisclaimerModal from '@/pages/dashboard/StreakDisclaimerModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUSD = (n) =>
  '$' +
  Number(Math.abs(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtPct = (n, d = 2) => `${Number(n).toFixed(d)}%`;

const fmtX = (n) => `${Number(n).toFixed(2)}x`;

// ─── Core compounding engine ──────────────────────────────────────────────────
// Mirrors exactly the Excel sheet logic:
//   Risk$   = startingBalance × riskPct
//   Profit$ = Risk$ × rrRatio
//   Ending  = Starting + Profit$
function buildStreak(startingCapital, riskPct, rrRatio, numTrades) {
  const rows = [];
  let balance = parseFloat(startingCapital) || 10;
  const r = parseFloat(riskPct) / 100 || 0.3;
  const rr = parseFloat(rrRatio) || 1.5;
  const n = Math.min(parseInt(numTrades) || 10, 100); // cap at 100 rows

  for (let i = 1; i <= n; i++) {
    const riskUsd = balance * r;
    const profitUsd = riskUsd * rr;
    const endingBalance = balance + profitUsd;
    rows.push({
      trade: i,
      startingBalance: balance,
      riskUsd,
      profitUsd,
      endingBalance,
      multiplier: endingBalance / parseFloat(startingCapital),
      growthPct:
        ((endingBalance - parseFloat(startingCapital)) /
          parseFloat(startingCapital)) *
        100,
    });
    balance = endingBalance;
  }
  return rows;
}

// Find how many consecutive wins needed to reach a target
function tradesNeeded(startingCapital, riskPct, rrRatio, targetBalance) {
  let balance = parseFloat(startingCapital) || 10;
  const r = parseFloat(riskPct) / 100;
  const rr = parseFloat(rrRatio);
  const target = parseFloat(targetBalance);
  if (target <= balance) return 0;
  let count = 0;
  while (balance < target && count < 1000) {
    balance = balance + balance * r * rr;
    count++;
  }
  return count;
}

// ─── Mini SVG sparkline ───────────────────────────────────────────────────────
const Sparkline = ({ rows }) => {
  if (!rows.length) return null;
  const W = 100;
  const H = 48;
  const pad = 4;
  const values = rows.map((r) => r.endingBalance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / Math.max(values.length - 1, 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="ss-sparkline"
      preserveAspectRatio="none"
    >
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─── Milestone badges ─────────────────────────────────────────────────────────
const MILESTONES = [2, 5, 10, 25, 50, 100];

// ─── Main Component ───────────────────────────────────────────────────────────
const StreakSimulator = () => {
  // Disclaimer shows on every mount (every visit / refresh — no localStorage)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [startingCapital, setStartingCapital] = useState(10);
  const [riskPct, setRiskPct] = useState(30);
  const [rrRatio, setRrRatio] = useState(1.5);
  const [numTrades, setNumTrades] = useState(7);
  const [targetBalance, setTargetBalance] = useState('');
  const [highlightRow, setHighlightRow] = useState(null);

  const rows = useMemo(
    () => buildStreak(startingCapital, riskPct, rrRatio, numTrades),
    [startingCapital, riskPct, rrRatio, numTrades],
  );

  const finalBalance = rows.length
    ? rows[rows.length - 1].endingBalance
    : parseFloat(startingCapital);
  const totalGrowthPct = rows.length ? rows[rows.length - 1].growthPct : 0;
  const totalMultiplier = rows.length ? rows[rows.length - 1].multiplier : 1;

  const tradesForTarget =
    targetBalance && parseFloat(targetBalance) > parseFloat(startingCapital)
      ? tradesNeeded(startingCapital, riskPct, rrRatio, targetBalance)
      : null;

  // Which milestones are hit within the current streak?
  const hitMilestones = MILESTONES.filter((m) => {
    const t = tradesNeeded(
      startingCapital,
      riskPct,
      rrRatio,
      parseFloat(startingCapital) * m,
    );
    return t <= rows.length;
  });

  const reset = () => {
    setStartingCapital(10);
    setRiskPct(30);
    setRrRatio(1.5);
    setNumTrades(7);
    setTargetBalance('');
    setHighlightRow(null);
  };

  // EV per trade (risk% × RR — simple approximation at 100% win rate for streak)
  const rewardPctPerTrade =
    (parseFloat(riskPct) / 100) * parseFloat(rrRatio) * 100;

  return (
    <>
      {!disclaimerAccepted && (
        <StreakDisclaimerModal onAccept={() => setDisclaimerAccepted(true)} />
      )}
      <div className="streak-simulator">
        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div className="ss-page-header">
          <div className="ss-page-header__left">
            <h1 className="ss-page-header__title">
              <FaFire className="ss-page-header__icon" />
              Streak Simulator
            </h1>
            <p className="ss-page-header__sub">
              Auto-compounding growth challenge — visualise your winning streak
            </p>
          </div>
          <button className="ss-btn ss-btn--ghost ss-btn--sm" onClick={reset}>
            <FaRedo /> Reset
          </button>
        </div>

        {/* ── Top row ──────────────────────────────────────────────────── */}
        <div className="ss-top-row">
          {/* Settings card */}
          <div className="ss-card">
            <div className="ss-card__header">
              <FaBullseye className="ss-card__header-icon" />
              <span>Challenge Settings</span>
            </div>

            <div className="ss-field">
              <label className="ss-label">Starting capital ($)</label>
              <input
                className="ss-input ss-input--highlight"
                type="number"
                min="1"
                step="1"
                value={startingCapital}
                onChange={(e) => setStartingCapital(e.target.value)}
              />
            </div>

            <div className="ss-field-row">
              <div className="ss-field">
                <label className="ss-label">Risk per trade (%)</label>
                <input
                  className="ss-input ss-input--highlight"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                />
              </div>
              <div className="ss-field">
                <label className="ss-label">Reward : Risk (RR)</label>
                <input
                  className="ss-input ss-input--highlight"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={rrRatio}
                  onChange={(e) => setRrRatio(e.target.value)}
                />
              </div>
            </div>

            <div className="ss-field">
              <label className="ss-label">Number of winning trades</label>
              <input
                className="ss-input"
                type="number"
                min="1"
                max="100"
                step="1"
                value={numTrades}
                onChange={(e) => setNumTrades(e.target.value)}
              />
              <span className="ss-field__hint">Max 100 trades</span>
            </div>

            <div className="ss-divider" />

            <div className="ss-field">
              <label className="ss-label">
                <FaBullseye style={{ marginRight: 4 }} />
                Target balance ($) — optional
              </label>
              <input
                className="ss-input"
                type="number"
                min="0"
                step="1"
                placeholder={`e.g. ${Math.round(parseFloat(startingCapital) * 10)}`}
                value={targetBalance}
                onChange={(e) => setTargetBalance(e.target.value)}
              />
            </div>

            {/* Target result */}
            {tradesForTarget !== null && (
              <div className="ss-target-pill">
                <FaTrophy />
                <span>
                  Reach <strong>{fmtUSD(targetBalance)}</strong> in{' '}
                  <strong>
                    {tradesForTarget} consecutive win
                    {tradesForTarget !== 1 ? 's' : ''}
                  </strong>
                </span>
              </div>
            )}

            {/* Reward per trade info */}
            <div className="ss-info-pill">
              <FaInfoCircle />
              <span>
                Each win compounds your balance by{' '}
                <strong>{fmtPct(rewardPctPerTrade)}</strong> (
                {fmtPct(parseFloat(riskPct))} risk × {rrRatio}R)
              </span>
            </div>
          </div>

          {/* Summary / chart card */}
          <div className="ss-card ss-card--summary">
            <div className="ss-card__header">
              <FaChartLine className="ss-card__header-icon" />
              <span>Growth Summary</span>
            </div>

            {/* KPI strip */}
            <div className="ss-kpi-grid">
              <div className="ss-kpi">
                <span className="ss-kpi__label">Starting</span>
                <span className="ss-kpi__value">{fmtUSD(startingCapital)}</span>
              </div>
              <div className="ss-kpi ss-kpi--featured">
                <span className="ss-kpi__label">After {numTrades} wins</span>
                <span className="ss-kpi__value">{fmtUSD(finalBalance)}</span>
              </div>
              <div className="ss-kpi ss-kpi--green">
                <span className="ss-kpi__label">Total growth</span>
                <span className="ss-kpi__value">
                  +{fmtPct(totalGrowthPct, 1)}
                </span>
              </div>
              <div className="ss-kpi ss-kpi--green">
                <span className="ss-kpi__label">Multiplier</span>
                <span className="ss-kpi__value">{fmtX(totalMultiplier)}</span>
              </div>
              <div className="ss-kpi">
                <span className="ss-kpi__label">Profit</span>
                <span className="ss-kpi__value">
                  {fmtUSD(finalBalance - parseFloat(startingCapital))}
                </span>
              </div>
              <div className="ss-kpi">
                <span className="ss-kpi__label">Avg profit/trade</span>
                <span className="ss-kpi__value">
                  {rows.length
                    ? fmtUSD(
                        (finalBalance - parseFloat(startingCapital)) /
                          rows.length,
                      )
                    : '$0.00'}
                </span>
              </div>
            </div>

            {/* Sparkline */}
            <div className="ss-chart-wrap">
              <div className="ss-chart-label">Balance curve</div>
              <Sparkline rows={rows} />
              <div className="ss-chart-axis">
                <span>Trade 1</span>
                <span>Trade {rows.length}</span>
              </div>
            </div>

            {/* Milestone hits */}
            {hitMilestones.length > 0 && (
              <div className="ss-milestones">
                <span className="ss-milestones__label">Milestones hit</span>
                <div className="ss-milestones__pills">
                  {hitMilestones.map((m) => (
                    <span key={m} className="ss-milestone-pill">
                      <FaTrophy /> {m}x
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Streak Table ────────────────────────────────────────────── */}
        <div className="ss-card ss-card--log">
          <div className="ss-card__header ss-card__header--log">
            <FaFire className="ss-card__header-icon" />
            <span>Compounding Streak Breakdown</span>
          </div>

          <div className="ss-table-wrap">
            <table className="ss-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Starting Balance</th>
                  <th>Risk $</th>
                  <th>Risk %</th>
                  <th>Profit $</th>
                  <th>Ending Balance</th>
                  <th>Growth %</th>
                  <th>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="ss-table__empty">
                      Adjust the settings above to see your streak
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.trade}
                      className={
                        highlightRow === row.trade ? 'ss-row--highlight' : ''
                      }
                      onMouseEnter={() => setHighlightRow(row.trade)}
                      onMouseLeave={() => setHighlightRow(null)}
                    >
                      <td className="ss-table__num">{row.trade}</td>
                      <td className="ss-table__mono">
                        {fmtUSD(row.startingBalance)}
                      </td>
                      <td className="ss-table__mono red">
                        {fmtUSD(row.riskUsd)}
                      </td>
                      <td className="ss-table__mono">{fmtPct(riskPct)}</td>
                      <td className="ss-table__mono green">
                        {fmtUSD(row.profitUsd)}
                      </td>
                      <td className="ss-table__mono ss-table__bold">
                        {fmtUSD(row.endingBalance)}
                      </td>
                      <td className="ss-table__mono green">
                        +{fmtPct(row.growthPct, 1)}
                      </td>
                      <td className="ss-table__mono">
                        <span
                          className={`ss-mult-badge ${row.multiplier >= 10 ? 'ss-mult-badge--gold' : row.multiplier >= 5 ? 'ss-mult-badge--green' : ''}`}
                        >
                          {fmtX(row.multiplier)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Tips ──────────────────────────────────────────────────── */}
        <div className="ss-tips">
          <span className="ss-tips__title">How it works</span>
          <span>
            Each win: <strong>Risk $ = Balance × {fmtPct(riskPct)}</strong> →
          </span>
          <span>
            <strong>Profit $ = Risk × {rrRatio}R</strong> →
          </span>
          <span>New balance compounds automatically.</span>
          <span>
            This is a <strong>best-case streak</strong> — all wins, no losses.
          </span>
        </div>
      </div>
    </>
  );
};

export default StreakSimulator;
