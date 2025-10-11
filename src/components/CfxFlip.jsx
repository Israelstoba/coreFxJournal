import React, { useState, useRef, useEffect } from 'react';
import './_cfxflip.scss';
import bullImg from '../assets/bull_head.png';
import bearImg from '../assets/bear_head.png';
import corefxLogo from '../assets/logo.png';
import { Link } from 'react-router-dom';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

export default function CfxFlip() {
  const [side, setSide] = useState('bull'); // 'bull' or 'bear' (user pick)
  const [trades, setTrades] = useState();
  const [riskR, setRiskR] = useState();
  const [rewardR, setRewardR] = useState();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]); // array of { outcome: 'bull'|'bear', win: boolean }
  const [currentFlip, setCurrentFlip] = useState(null); // 'bull'|'bear' while animating
  const coinRef = useRef(null);

  // Stats derived
  const totalWins = results.filter((r) => r.win).length;
  const totalLosses = results.filter((r) => !r.win).length;
  const pnlR = totalWins * rewardR - totalLosses * riskR;
  const winRate =
    results.length > 0 ? Math.round((totalWins / results.length) * 100) : 0;
  const traderStatus =
    pnlR > 0 ? 'Profitable' : pnlR < 0 ? 'Losing' : 'Break-even';

  // Reset results when inputs change
  useEffect(() => {
    setResults([]);
    setCurrentFlip(null);
    setRunning(false);
  }, [side, trades, riskR, rewardR]);

  // Randomly returns 'bull' or 'bear'
  const randomOutcome = () => (Math.random() < 0.5 ? 'bull' : 'bear');

  // Trigger the whole simulation
  const handleTakeTrades = async () => {
    if (running) return;
    const t = Math.max(1, Math.floor(trades));
    setResults([]);
    setRunning(true);

    for (let i = 0; i < t; i++) {
      // start spin
      const outcome = randomOutcome();
      setCurrentFlip(outcome); // set image that will show after spin
      // add spinning class
      if (coinRef.current) {
        coinRef.current.classList.remove('spin'); // restart animation
        // Force reflow to restart CSS animation
        // eslint-disable-next-line no-unused-expressions
        coinRef.current.offsetWidth;
        coinRef.current.classList.add('spin');
      }

      // wait while animation plays
      await sleep(900); // matches CSS animation duration

      const win = outcome === side;
      setResults((prev) => [...prev, { outcome, win }]);

      // brief pause between flips
      await sleep(350);
    }

    // end
    setRunning(false);
    setCurrentFlip(null);
    if (coinRef.current) coinRef.current.classList.remove('spin');
  };

  const handleReset = () => {
    if (running) return;
    setResults([]);
    setCurrentFlip(null);
  };

  return (
    <section className="cfxflip-page">
      <div className="cfxflip-card glass-bg">
        <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />

        <div className="cfxflip-controls">
          <div className="cfxflip-side">
            <label className="label">Select side</label>
            <div
              className="side-toggle"
              role="tablist"
              aria-label="Select side"
            >
              <button
                className={`side-btn ${side === 'bull' ? 'active' : ''}`}
                onClick={() => setSide('bull')}
                disabled={running}
              >
                Bull
              </button>
              <button
                className={`side-btn ${side === 'bear' ? 'active' : ''}`}
                onClick={() => setSide('bear')}
                disabled={running}
              >
                Bear
              </button>
            </div>
          </div>

          <div className="cfxflip-inputs">
            <div className="input-row">
              <label>Number of trades</label>
              <input
                type="number"
                min="1"
                value={trades}
                onChange={(e) => setTrades(Number(e.target.value))}
                disabled={running}
              />
            </div>

            <div className="input-row rr-row">
              <label>Risk : Reward</label>
              <div className="rr-inputs">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={riskR}
                  onChange={(e) => setRiskR(Number(e.target.value))}
                  disabled={running}
                />
                <span className="colon">:</span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={rewardR}
                  onChange={(e) => setRewardR(Number(e.target.value))}
                  disabled={running}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="coin-area">
          <div
            className={`coin ${running ? 'busy' : ''}`}
            ref={coinRef}
            aria-hidden="true"
            title="Coin"
          >
            <img
              src={currentFlip === 'bear' ? bearImg : bullImg}
              alt="coin"
              className="coin-face"
            />
          </div>
          <div className="coin-area-btn-con">
            <button
              className="take-trade-btn"
              onClick={handleTakeTrades}
              disabled={running}
              aria-pressed={running}
            >
              {running ? 'Trading...' : 'Take trade'}
            </button>

            <button
              className="reset-btn"
              onClick={handleReset}
              disabled={running}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="results-box">
          <h3>Trade Outcome</h3>

          <div className="outcomes-grid" aria-live="polite">
            {results.map((r, i) => (
              <div
                key={i}
                className={`outcome-pill ${r.win ? 'win' : 'loss'}`}
                title={r.win ? `+${rewardR}R` : `-${riskR}R`}
              >
                {r.win ? `+${rewardR}R` : `-${riskR}R`}
              </div>
            ))}
            {/* show placeholders for remaining */}
            {Array.from({ length: Math.max(0, trades - results.length) }).map(
              (_, i) => (
                <div key={`ph-${i}`} className="outcome-pill placeholder">
                  &nbsp;
                </div>
              )
            )}
          </div>

          <div className="divider" />

          <div className="total-con">
            <div className="total-content">
              <h4 className="total-con-label">Total wins</h4>
              <div className="total-green">{totalWins}</div>
            </div>

            <div className="total-content">
              <h4 className="total-con-label">Total losses</h4>
              <div className="total-red">{totalLosses}</div>
            </div>
          </div>
          <div className="pnl-con">
            <div className="pnl-content">
              <h4 className="pnl-label">PnL (R)</h4>
              <div className="pnl">
                {pnlR >= 0 ? `+${pnlR.toFixed(2)}R` : `${pnlR.toFixed(2)}R`}
              </div>
            </div>

            <div className="pnl-content">
              <h4 className="pnl-label">Win rate</h4>
              <div className="rate">{winRate}%</div>
            </div>
          </div>

          <div className="trader-status">
            Trader Status:{' '}
            <span
              className={`status ${
                pnlR > 0 ? 'profitable' : pnlR < 0 ? 'losing' : 'breakeven'
              }`}
            >
              {traderStatus}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
