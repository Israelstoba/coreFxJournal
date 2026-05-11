// src/components/dashboard/StreakDisclaimerModal.jsx
import React, { useState, useEffect } from 'react';
import {
  FaFire,
  FaBrain,
  FaChartLine,
  FaShieldAlt,
  FaTimes,
} from 'react-icons/fa';
import '@/styles/dashboard/_streakdisclaimermodal.scss';

const StreakDisclaimerModal = ({ onAccept }) => {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  // Show on every mount (every page visit or refresh)
  useEffect(() => {
    // Small delay so the page renders first, then modal slides in
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  const handleAccept = () => {
    if (!checked) return;
    setAnimateOut(true);
    setTimeout(() => {
      setVisible(false);
      onAccept?.();
    }, 380);
  };

  if (!visible) return null;

  return (
    <div className={`sdm-overlay${animateOut ? ' sdm-overlay--out' : ''}`}>
      <div className={`sdm-modal${animateOut ? ' sdm-modal--out' : ''}`}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="sdm-header">
          <div className="sdm-header__icon-wrap">
            <FaFire className="sdm-header__fire" />
          </div>
          <div className="sdm-header__text">
            <h2 className="sdm-header__title">Before You Begin</h2>
            <p className="sdm-header__sub">
              Streak Simulator — a mindset tool, not a shortcut
            </p>
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="sdm-divider" />

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="sdm-body">
          <p className="sdm-intro">
            This simulator is built for <strong>serious traders</strong> who
            understand that consistency beats luck — every time. Please read the
            following before proceeding.
          </p>

          <div className="sdm-points">
            <div className="sdm-point">
              <div className="sdm-point__icon sdm-point__icon--red">
                <FaBrain />
              </div>
              <div className="sdm-point__text">
                <strong>This is not a gambling tool.</strong>
                <span>
                  The streak simulator does <em>not</em> encourage you to place
                  reckless trades chasing a winning run. Real markets are
                  unpredictable — losses happen.
                </span>
              </div>
            </div>

            <div className="sdm-point">
              <div className="sdm-point__icon sdm-point__icon--green">
                <FaShieldAlt />
              </div>
              <div className="sdm-point__text">
                <strong>Build confidence in your edge.</strong>
                <span>
                  Use this tool to visualise what disciplined, risk-managed
                  trading can compound into over time — only when you have a
                  proven, backtested strategy.
                </span>
              </div>
            </div>

            <div className="sdm-point">
              <div className="sdm-point__icon sdm-point__icon--blue">
                <FaChartLine />
              </div>
              <div className="sdm-point__text">
                <strong>Reward hard work, not luck.</strong>
                <span>
                  The numbers here represent the potential of{' '}
                  <em>consistent execution</em>. Journal your trades, refine
                  your setups, and let compounding reward your process — not
                  your hope.
                </span>
              </div>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="sdm-quote">
            "The goal is not to be right on every trade. The goal is to be so
            disciplined that when you are right, it compounds into something
            meaningful."
            <cite>— CoreFX Trading Philosophy</cite>
          </blockquote>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="sdm-footer">
          <label className="sdm-checkbox-wrap">
            <input
              type="checkbox"
              className="sdm-checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span className="sdm-checkbox__custom" />
            <span className="sdm-checkbox__label">
              I understand this is a strategy confidence tool, not a gambling
              simulator.
            </span>
          </label>

          <button
            className={`sdm-accept-btn${checked ? ' sdm-accept-btn--ready' : ''}`}
            onClick={handleAccept}
            disabled={!checked}
          >
            <FaFire />
            Let's Build — Enter Simulator
          </button>
        </div>
      </div>
    </div>
  );
};

export default StreakDisclaimerModal;
