import { useState, useEffect } from 'react';
import corefxLogo from '../assets/logo.png';
import './_calculator.scss';

const API_KEY = 'demo'; // Alpha Vantage FX
const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
const METALS_API_URL =
  'https://metals-api.com/api/latest?access_key=YOUR_KEY&base=USD&symbols=XAU,XAG';

const Calculator = () => {
  const [balance, setBalance] = useState('');
  const [risk, setRisk] = useState('');
  const [slPips, setSlPips] = useState('');
  const [lotSize, setLotSize] = useState(null);
  const [riskAmount, setRiskAmount] = useState(null);
  const [riskMode, setRiskMode] = useState('%');
  const [instrument, setInstrument] = useState('');

  // Live prices
  const [usdJpyRate, setUsdJpyRate] = useState(150);
  const [xauUsdRate, setXauUsdRate] = useState(null);
  const [xagUsdRate, setXagUsdRate] = useState(null);
  const [btcUsdRate, setBtcUsdRate] = useState(null);
  const [us30Rate, setUs30Rate] = useState(null);
  const [nas100Rate, setNas100Rate] = useState(null);
  const [spx500Rate, setSpx500Rate] = useState(null);

  useEffect(() => {
    // FX USD/JPY
    fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=JPY&apikey=${API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => {
        const rate =
          data?.['Realtime Currency Exchange Rate']?.['5. Exchange Rate'];
        if (rate) setUsdJpyRate(parseFloat(rate));
      })
      .catch(console.error);

    // Metals (XAU, XAG)
    fetch(METALS_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates) {
          setXauUsdRate(data.rates.XAU);
          setXagUsdRate(data.rates.XAG);
        }
      })
      .catch(console.error);

    // Crypto BTC/USD
    fetch(COINGECKO_URL)
      .then((res) => res.json())
      .then((data) => setBtcUsdRate(data.bitcoin.usd))
      .catch(console.error);

    // Indices (Yahoo Finance)
    fetch('https://yahoo-finance-api.vercel.app/quote?symbols=^DJI,^IXIC,^GSPC')
      .then((res) => res.json())
      .then((data) => {
        setUs30Rate(data['^DJI']?.regularMarketPrice || null);
        setNas100Rate(data['^IXIC']?.regularMarketPrice || null);
        setSpx500Rate(data['^GSPC']?.regularMarketPrice || null);
      })
      .catch(console.error);
  }, []);

  const getPipValue = (symbol) => {
    if (symbol.includes('JPY')) return 1000 / usdJpyRate;
    if (symbol === 'XAU/USD') return 1;
    if (symbol === 'XAG/USD') return 0.1;
    if (symbol === 'BTC/USD') return 1;
    if (['US30', 'NAS100', 'SPX500'].includes(symbol)) return 1;
    return 10;
  };

  const calculate = () => {
    if (!balance || !risk || !slPips || !instrument) return;

    const riskAmt =
      riskMode === '%' ? balance * (risk / 100) : parseFloat(risk);
    let adjustedSlPips = parseFloat(slPips);

    const specialInstruments = [
      'XAU/USD',
      'XAG/USD',
      'BTC/USD',
      'US30',
      'NAS100',
      'SPX500',
    ];
    if (specialInstruments.includes(instrument) && adjustedSlPips < 50)
      adjustedSlPips *= 100;

    const pipValue = getPipValue(instrument);
    const lot = riskAmt / (adjustedSlPips * pipValue);

    setRiskAmount(riskAmt.toFixed(2));
    setLotSize(lot.toFixed(3));
  };

  const toggleRiskMode = () => {
    if (!balance) {
      setRiskMode(riskMode === '%' ? '$' : '%');
      return;
    }
    if (riskMode === '%') {
      setRisk((balance * (risk / 100)).toFixed(2));
      setRiskMode('$');
    } else {
      setRisk(((risk / balance) * 100).toFixed(2));
      setRiskMode('%');
    }
  };

  const getLivePrice = () => {
    switch (instrument) {
      case 'USD/JPY':
        return usdJpyRate?.toFixed(3);
      case 'XAU/USD':
        return xauUsdRate?.toFixed(2);
      case 'XAG/USD':
        return xagUsdRate?.toFixed(2);
      case 'BTC/USD':
        return btcUsdRate?.toFixed(2);
      case 'US30':
        return us30Rate?.toFixed(2);
      case 'NAS100':
        return nas100Rate?.toFixed(2);
      case 'SPX500':
        return spx500Rate?.toFixed(2);
      default:
        return null;
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

          <label>Instrument:</label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
          >
            <option value="" disabled>
              Select instrument
            </option>
            <optgroup label="Major Pairs">
              <option>EUR/USD</option>
              <option>GBP/USD</option>
              <option>USD/JPY</option>
              <option>USD/CHF</option>
              <option>USD/CAD</option>
              <option>AUD/USD</option>
              <option>NZD/USD</option>
            </optgroup>
            <optgroup label="Minor Pairs">
              <option>EUR/GBP</option>
              <option>EUR/JPY</option>
              <option>GBP/JPY</option>
              <option>AUD/CAD</option>
              <option>NZD/JPY</option>
            </optgroup>
            <optgroup label="Metals">
              <option>XAU/USD</option>
              <option>XAG/USD</option>
            </optgroup>
            <optgroup label="Crypto">
              <option>BTC/USD</option>
            </optgroup>
            <optgroup label="Indices">
              <option>US30</option>
              <option>NAS100</option>
              <option>SPX500</option>
            </optgroup>
          </select>

          {getLivePrice() && (
            <small className="live-price">{`Live: ${getLivePrice()}`}</small>
          )}

          <label>Risk ({riskMode}):</label>
          <div className="risk-row">
            <input
              type="number"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              placeholder={riskMode === '%' ? 'Enter %' : 'Enter $ amount'}
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
            placeholder="Enter SL pips (TradingView style allowed)"
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
