import { useState, useEffect } from 'react';
import corefxLogo from '../assets/logo.png';
import './_calculator.scss';

const API_KEY = 'demo'; // 🔑 replace with your real Alpha Vantage key

const Calculator = () => {
  const [balance, setBalance] = useState('');
  const [risk, setRisk] = useState('');
  const [slPips, setSlPips] = useState('');
  const [lotSize, setLotSize] = useState(null);
  const [riskAmount, setRiskAmount] = useState(null);
  const [riskMode, setRiskMode] = useState('%'); // "%" or "$"
  const [instrument, setInstrument] = useState('');
  const [usdJpyRate, setUsdJpyRate] = useState(150); // fallback default

  // ✅ Fetch live USD/JPY price only once on page load
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=JPY&apikey=${API_KEY}`
        );
        const data = await res.json();
        const rate =
          data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
        if (rate) {
          setUsdJpyRate(parseFloat(rate));
          console.log('✅ Live USD/JPY:', rate);
        } else {
          console.warn('⚠️ No USD/JPY rate in response', data);
        }
      } catch (err) {
        console.error('Error fetching USD/JPY:', err);
      }
    };

    fetchRate(); // only once
  }, []);

  // ✅ pip values per instrument type
  const getPipValue = (pair) => {
    if (pair.includes('JPY')) return 1000 / usdJpyRate; // dynamic pip value for JPY pairs
    if (pair === 'XAU/USD') return 1; // Gold
    return 10; // Standard USD-quoted pairs
  };

  // ✅ Calculate lot size
  const calculate = () => {
    if (!balance || !risk || !slPips || !instrument) return;

    let riskAmt = riskMode === '%' ? balance * (risk / 100) : parseFloat(risk);

    const pipValue = getPipValue(instrument);
    if (!pipValue || pipValue === 0) {
      alert('Live price not available yet, please wait...');
      return;
    }

    const lot = riskAmt / (slPips * pipValue);

    setRiskAmount(riskAmt.toFixed(2));
    setLotSize(lot.toFixed(3));
  };

  // ✅ Toggle risk mode and auto-convert value
  const toggleRiskMode = () => {
    if (!balance) {
      setRiskMode(riskMode === '%' ? '$' : '%');
      return;
    }

    if (riskMode === '%') {
      const dollarValue = (balance * (risk / 100)).toFixed(2);
      setRisk(dollarValue);
      setRiskMode('$');
    } else {
      const percentValue = ((risk / balance) * 100).toFixed(2);
      setRisk(percentValue);
      setRiskMode('%');
    }
  };

  return (
    <section className="calculator-section">
      <div className="calculator-card glass-bg">
        <img src={corefxLogo} alt="CoreFx" className="calculator-logo" />
        <h2 className="calculator-title">Lot Size Calculator</h2>

        <div className="calculator-form">
          <label>Account Balance ($):</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="Enter account size"
          />

          <label>Trading Instrument:</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            <option value="" disabled>
              Select trading instrument
            </option>
            <option>EUR/USD</option>
            <option>GBP/USD</option>
            <option>USD/CAD</option>
            <option>GBP/JPY</option>
            <option>USD/JPY</option>
            <option>AUD/CAD</option>
            <option>XAU/USD</option>
          </select>

          {/* ✅ Show USD/JPY live rate if selected */}
          {instrument.includes('JPY') && (
            <div className="rate-box">
              <small className="live-price">
                Live USD/JPY: {usdJpyRate.toFixed(3)}
              </small>
            </div>
          )}

          {/* ✅ Risk Tolerance with unit */}
          <label style={{ color: 'white' }}>Risk Tolerance ({riskMode}):</label>
          <div className="risk-row">
            <input
              type="number"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              placeholder={
                riskMode === '%' ? 'Enter risk %' : 'Enter risk amount ($)'
              }
            />
            <span className="unit">{riskMode}</span>
            <button type="button" className="swap-btn" onClick={toggleRiskMode}>
              Swap
            </button>
          </div>

          <label>Stop-Loss (Pips):</label>
          <input
            type="number"
            value={slPips}
            onChange={(e) => setSlPips(e.target.value)}
            placeholder="Enter stop loss pip"
          />

          <button className="calculate-btn" onClick={calculate}>
            Calculate
          </button>
        </div>

        {lotSize && (
          <div className="result-box">
            <p>
              Risk Amount: <strong>${riskAmount}</strong>
            </p>
            <p>LOT SIZE</p>
            <h3>{lotSize}</h3>
          </div>
        )}
      </div>
    </section>
  );
};

export default Calculator;
