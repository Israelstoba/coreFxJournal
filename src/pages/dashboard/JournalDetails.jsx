import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  PlusCircle,
  Calendar,
  BarChart3,
  Filter,
  Table,
  X,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';

// Trade Modal Component
const TradeModal = ({ onClose, onSave, editData, accountSize = 10000 }) => {
  const [form, setForm] = useState({
    date: '',
    time: '',
    pair: '',
    entry: '',
    sl: '',
    tp: '',
    exit: '',
    lotSize: '',
    riskPercent: '0.00',
    session: '',
    strategy: '',
    entryReason: '',
    screenshot: null,
    errors: {},
  });

  useEffect(() => {
    if (editData) {
      setForm({ ...editData });
    }
  }, [editData]);

  // Auto-calculate risk percent when relevant fields change
  useEffect(() => {
    const calculatedRisk = calculateRiskPercent();
    setForm((prev) => ({ ...prev, riskPercent: calculatedRisk }));
  }, [form.entry, form.sl, form.lotSize, form.pair]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const newErrors = { ...prev.errors };
      delete newErrors[name];
      return { ...prev, [name]: value, errors: newErrors };
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, screenshot: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-calculate risk percent based on actual account size
  const calculateRiskPercent = () => {
    const { entry, sl, lotSize, pair } = form;

    if (!entry || !sl || !lotSize || !pair) return '0.00';

    const entryPrice = parseFloat(entry);
    const slPrice = parseFloat(sl);
    const lots = parseFloat(lotSize);

    if (entryPrice === 0 || lots === 0) return '0.00';

    // Calculate pip difference
    const pipDifference = Math.abs(entryPrice - slPrice);

    // Determine pip value based on pair
    let pipValue;
    if (pair.includes('JPY')) {
      // For JPY pairs, 1 pip = 0.01
      const pips = pipDifference / 0.01;
      pipValue = pips * 10 * lots; // $10 per pip per standard lot for JPY pairs
    } else if (pair.includes('XAU') || pair.includes('GOLD')) {
      // For Gold (XAU/USD), 1 pip = 0.01
      const pips = pipDifference / 0.01;
      pipValue = pips * 10 * lots;
    } else if (pair.includes('US30') || pair.includes('NAS100')) {
      // For indices, 1 point = 1.00
      const points = pipDifference / 1;
      pipValue = points * 10 * lots;
    } else {
      // For standard pairs (EUR/USD, GBP/USD, etc), 1 pip = 0.0001
      const pips = pipDifference / 0.0001;
      pipValue = pips * 10 * lots;
    }

    // Calculate risk as percentage of account
    const riskPercent = (pipValue / accountSize) * 100;

    return riskPercent.toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate ALL fields as required
    const errors = {};
    if (!form.date) errors.date = true;
    if (!form.time) errors.time = true;
    if (!form.pair) errors.pair = true;
    if (!form.entry) errors.entry = true;
    if (!form.sl) errors.sl = true;
    if (!form.tp) errors.tp = true;
    if (!form.exit) errors.exit = true;
    if (!form.lotSize) errors.lotSize = true;
    if (!form.session) errors.session = true;
    if (!form.strategy) errors.strategy = true;
    if (!form.entryReason) errors.entryReason = true;

    if (Object.keys(errors).length > 0) {
      setForm((prev) => ({ ...prev, errors }));
      alert('Please fill ALL fields (marked with red outline)');
      return;
    }

    // Clear errors and save
    const { errors: _, ...tradeData } = form;
    onSave({ ...tradeData, id: editData?.id || Date.now() });
  };

  return (
    <div className="modal-overlay">
      <div className="trade-modal glassy-ctr">
        <div className="modal-header">
          <h3>{editData ? 'Edit Trade' : 'Add New Trade'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className={form.errors?.date ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className={form.errors?.time ? 'error-field' : ''}
              />
            </div>

            <div>
              <select
                name="pair"
                value={form.pair}
                onChange={handleChange}
                className={form.errors?.pair ? 'error-field' : ''}
              >
                <option value="">Select Pair *</option>
                <option value="GBP/JPY">GBP/JPY</option>
                <option value="GBP/USD">GBP/USD</option>
                <option value="EUR/USD">EUR/USD</option>
                <option value="USD/JPY">USD/JPY</option>
                <option value="XAU/USD">XAU/USD</option>
                <option value="US30">US30</option>
              </select>
            </div>

            <div>
              <input
                type="number"
                name="entry"
                step="0.001"
                value={form.entry}
                onChange={handleChange}
                placeholder="Entry Price *"
                className={form.errors?.entry ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="number"
                name="sl"
                step="0.001"
                value={form.sl}
                onChange={handleChange}
                placeholder="Stop Loss *"
                className={form.errors?.sl ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="number"
                name="tp"
                step="0.001"
                value={form.tp}
                onChange={handleChange}
                placeholder="Take Profit *"
                className={form.errors?.tp ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="number"
                name="exit"
                step="0.001"
                value={form.exit}
                onChange={handleChange}
                placeholder="Exit Price *"
                className={form.errors?.exit ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="number"
                name="lotSize"
                step="0.01"
                value={form.lotSize}
                onChange={handleChange}
                placeholder="Lot Size *"
                className={form.errors?.lotSize ? 'error-field' : ''}
              />
            </div>

            <div>
              <input
                type="text"
                name="riskPercent"
                value={`${form.riskPercent}%`}
                readOnly
                disabled
                placeholder="Risk % (Auto)"
                style={{
                  backgroundColor: 'rgba(100, 100, 100, 0.3)',
                  cursor: 'not-allowed',
                  fontWeight: 'bold',
                  color:
                    parseFloat(form.riskPercent) <= 2
                      ? '#4caf50'
                      : parseFloat(form.riskPercent) <= 5
                      ? '#f59e0b'
                      : '#ff4d4d',
                }}
                title={`Risk based on account size: $${accountSize.toLocaleString()}`}
              />
            </div>

            <div>
              <select
                name="session"
                value={form.session}
                onChange={handleChange}
                className={form.errors?.session ? 'error-field' : ''}
              >
                <option value="">Select Session *</option>
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Asian">Asian</option>
              </select>
            </div>

            <div>
              <select
                name="strategy"
                value={form.strategy}
                onChange={handleChange}
                className={form.errors?.strategy ? 'error-field' : ''}
              >
                <option value="">Select Strategy *</option>
                <option value="Break & Retest">Break & Retest</option>
                <option value="Liquidity Grab">Liquidity Grab</option>
                <option value="Trend Continuation">Trend Continuation</option>
                <option value="FVG">FVG</option>
                <option value="Order Block">Order Block</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <textarea
              name="entryReason"
              value={form.entryReason}
              onChange={handleChange}
              rows={3}
              placeholder="Entry Reason / Notes * - Describe your trade setup, confluences, and reasoning..."
              className={form.errors?.entryReason ? 'error-field' : ''}
            />
          </div>

          <div className="form-row">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              id="screenshot-upload"
            />
            {form.screenshot && (
              <div className="screenshot-preview-container">
                <img
                  src={form.screenshot}
                  alt="Trade screenshot"
                  className="screenshot-preview"
                />
                <button
                  type="button"
                  className="delete-screenshot-btn"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, screenshot: null }));
                    document.getElementById('screenshot-upload').value = '';
                  }}
                  title="Remove screenshot"
                >
                  <Trash2 size={16} />
                  Delete Image
                </button>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {editData ? 'Update Trade' : 'Save Trade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Screenshot Modal Component
const ScreenshotModal = ({ screenshot, onClose }) => {
  if (!screenshot) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="screenshot-modal" onClick={(e) => e.stopPropagation()}>
        <div className="screenshot-modal-header">
          <h3>Trade Screenshot</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="screenshot-modal-content">
          <img src={screenshot} alt="Trade chart" />
        </div>
      </div>
    </div>
  );
};

// Main Journal Details Component
const JournalDetails = ({
  selectedJournal,
  onBack,
  onUpdateJournal = () => {},
}) => {
  const storageKey = `corefx_journal_${selectedJournal.id}_trades`;

  const [trades, setTrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTrade, setEditTrade] = useState(null);
  const [activeView, setActiveView] = useState('table');
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    pair: 'all',
    session: 'all',
    strategy: 'all',
    dateFrom: '',
    dateTo: '',
  });

  // Load trades from localStorage on mount
  useEffect(() => {
    try {
      const savedTrades = localStorage.getItem(storageKey);
      if (savedTrades) {
        const parsed = JSON.parse(savedTrades);
        setTrades(parsed);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
    }
  }, [storageKey]);

  // Save trades to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trades));
    } catch (error) {
      console.error('Error saving trades:', error);
    }
  }, [trades, storageKey]);

  const handleSaveTrade = (trade) => {
    if (editTrade) {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === editTrade.id ? { ...trade, id: editTrade.id } : t
        )
      );
    } else {
      setTrades((prev) => [...prev, { ...trade, id: Date.now() }]);
    }
    setShowModal(false);
    setEditTrade(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this trade?')) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const calculateRR = (trade) => {
    if (!trade.entry || !trade.sl || (!trade.tp && !trade.exit)) return 0;
    const entry = parseFloat(trade.entry);
    const sl = parseFloat(trade.sl);
    const tpOrExit = trade.exit ? parseFloat(trade.exit) : parseFloat(trade.tp);
    const isBuy = tpOrExit > entry;
    const risk = isBuy ? entry - sl : sl - entry;
    const reward = isBuy ? tpOrExit - entry : entry - tpOrExit;
    return risk === 0 ? 0 : reward / risk;
  };

  const calculatePnL = (trade) => {
    if (!trade.riskPercent) return 0;
    const rr = calculateRR(trade);
    return rr * parseFloat(trade.riskPercent);
  };

  const filteredTrades = trades.filter((trade) => {
    if (
      filters.search &&
      !trade.pair.toLowerCase().includes(filters.search.toLowerCase()) &&
      !trade.strategy?.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false;
    if (filters.pair !== 'all' && trade.pair !== filters.pair) return false;
    if (filters.session !== 'all' && trade.session !== filters.session)
      return false;
    if (filters.strategy !== 'all' && trade.strategy !== filters.strategy)
      return false;
    if (filters.dateFrom && trade.date < filters.dateFrom) return false;
    if (filters.dateTo && trade.date > filters.dateTo) return false;
    return true;
  });

  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(
    (t) => calculatePnL(t) > 0
  ).length;
  const losingTrades = filteredTrades.filter((t) => calculatePnL(t) < 0).length;
  const winRate =
    totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
  const totalPnL = filteredTrades.reduce((sum, t) => sum + calculatePnL(t), 0);
  const avgRR =
    totalTrades > 0
      ? (
          filteredTrades.reduce((sum, t) => sum + calculateRR(t), 0) /
          totalTrades
        ).toFixed(2)
      : 0;

  // Calculate current balance
  const initialBalance =
    selectedJournal.initialBalance || selectedJournal.accountSize;
  const totalPnLDollars = trades.reduce((sum, trade) => {
    const pnlPercent = calculatePnL(trade);
    const pnlDollars = (initialBalance * pnlPercent) / 100;
    return sum + pnlDollars;
  }, 0);
  const currentBalance = initialBalance + totalPnLDollars;

  const renderTableView = () => (
    <div className="trade-table-wrapper glassy-ctr">
      <div className="table-scroll-container">
        <table className="trade-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pair</th>
              <th>Session</th>
              <th>Entry</th>
              <th>SL</th>
              <th>TP</th>
              <th>Exit</th>
              <th>R:R</th>
              <th>PnL %</th>
              <th>Strategy</th>
              <th>Reflection</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan="12" className="empty-table">
                  No trades found
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => {
                const rr = calculateRR(trade);
                const pnl = calculatePnL(trade);
                return (
                  <tr key={trade.id}>
                    <td>{trade.date}</td>
                    <td className="pair-cell">{trade.pair}</td>
                    <td>{trade.session || '-'}</td>
                    <td>{trade.entry}</td>
                    <td>{trade.sl}</td>
                    <td>{trade.tp}</td>
                    <td>{trade.exit || '-'}</td>
                    <td
                      className={
                        rr >= 2 ? 'rr-good' : rr >= 1 ? 'rr-mid' : 'rr-bad'
                      }
                    >
                      {rr.toFixed(2)}
                    </td>
                    <td className={pnl > 0 ? 'positive' : 'negative'}>
                      {pnl > 0 ? '+' : ''}
                      {pnl.toFixed(2)}%
                    </td>
                    {/* <td>{trade.strategy || '-'}</td>
                    <td className="action-btns"> */}

                    <td>{trade.strategy || '-'}</td>
                    <td
                      className="reflection-cell"
                      title={trade.entryReason || 'No reflection'}
                    >
                      {trade.entryReason ? (
                        <span className="reflection-text">
                          {trade.entryReason.length > 50
                            ? `${trade.entryReason.substring(0, 50)}...`
                            : trade.entryReason}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="action-btns">
                      <button
                        className="edit"
                        onClick={() => {
                          setEditTrade(trade);
                          setShowModal(true);
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete"
                        onClick={() => handleDelete(trade.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCalendarView = () => {
    const tradesByDate = {};
    filteredTrades.forEach((trade) => {
      if (!tradesByDate[trade.date]) tradesByDate[trade.date] = [];
      tradesByDate[trade.date].push(trade);
    });

    return (
      <div className="calendar-view">
        {Object.entries(tradesByDate).length === 0 ? (
          <div className="empty-calendar">No trades to display</div>
        ) : (
          Object.entries(tradesByDate)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, dayTrades]) => {
              const dayPnL = dayTrades.reduce(
                (sum, t) => sum + calculatePnL(t),
                0
              );
              return (
                <div
                  key={date}
                  className={`calendar-card ${
                    dayPnL > 0 ? 'profit-day' : 'loss-day'
                  }`}
                >
                  <h4 className="calendar-date">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {dayTrades.some((t) => t.time) && (
                      <span className="calendar-times">
                        {' ⏲ '}
                        {dayTrades
                          .filter((t) => t.time)
                          .map((t) => t.time)
                          .join(', ')}
                      </span>
                    )}
                  </h4>
                  <div
                    className={`day-pnl ${
                      dayPnL > 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {dayPnL > 0 ? '+' : ''}
                    {dayPnL.toFixed(2)}%
                  </div>
                  {dayTrades.map((trade) => (
                    <div key={trade.id} className="calendar-trade">
                      <div className="trade-header">
                        <span className="trade-pair">{trade.pair}</span>
                        <span
                          className={`trade-pnl ${
                            calculatePnL(trade) > 0 ? 'positive' : 'negative'
                          }`}
                        >
                          {calculatePnL(trade) > 0 ? '+' : ''}
                          {calculatePnL(trade).toFixed(2)}%
                        </span>
                      </div>
                      <div className="trade-info">
                        {trade.strategy || 'No strategy'} | R:R{' '}
                        {calculateRR(trade).toFixed(2)}
                      </div>
                      {trade.entryReason && (
                        <div className="trade-reflection">
                          <strong>Reflection:</strong> {trade.entryReason}
                        </div>
                      )}
                      {trade.screenshot && (
                        <div className="trade-screenshot">
                          <img src={trade.screenshot} alt="Trade chart" />
                          <button
                            className="view-screenshot-btn"
                            onClick={() => {
                              setSelectedScreenshot(trade.screenshot);
                              setShowScreenshotModal(true);
                            }}
                          >
                            View Screenshot
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })
        )}
      </div>
    );
  };

  const renderAnalyticsView = () => (
    <div className="analytics-view">
      <div className="stat-card total-trades">
        <h3>Total Trades</h3>
        <div className="stat-value">{totalTrades}</div>
      </div>

      <div className="stat-card win-rate">
        <h3>Win Rate</h3>
        <div className="stat-value">{winRate}%</div>
        <div className="stat-detail">
          {winningTrades}W / {losingTrades}L
        </div>
      </div>

      <div
        className={`stat-card total-pnl ${totalPnL >= 0 ? 'profit' : 'loss'}`}
      >
        <h3>Total P&L</h3>
        <div className="stat-value">
          {totalPnL > 0 ? '+' : ''}
          {totalPnL.toFixed(2)}%
        </div>
        {selectedJournal.accountSize && (
          <div className="stat-detail">
            $
            {totalPnLDollars.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        )}
      </div>

      <div className="stat-card avg-rr">
        <h3>Avg R:R</h3>
        <div className="stat-value">{avgRR}</div>
      </div>

      <div className="stat-card balance-card">
        <h3>Account Balance</h3>
        <div className="stat-detail">
          Initial: ${initialBalance.toLocaleString()}
        </div>
        <div className="stat-value current-balance-value">
          $
          {currentBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
        <div
          className={`stat-detail ${
            totalPnLDollars >= 0 ? 'profit-text' : 'loss-text'
          }`}
        >
          {totalPnLDollars >= 0 ? '+' : ''}$
          {totalPnLDollars.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      <div className="stat-card performance-by-pair">
        <h3>Performance by Pair</h3>
        {Array.from(new Set(filteredTrades.map((t) => t.pair))).length === 0 ? (
          <div className="no-data">No data available</div>
        ) : (
          Array.from(new Set(filteredTrades.map((t) => t.pair))).map((pair) => {
            const pairTrades = filteredTrades.filter((t) => t.pair === pair);
            const pairPnL = pairTrades.reduce(
              (sum, t) => sum + calculatePnL(t),
              0
            );
            const pairWinRate =
              pairTrades.length > 0
                ? (
                    (pairTrades.filter((t) => calculatePnL(t) > 0).length /
                      pairTrades.length) *
                    100
                  ).toFixed(0)
                : 0;
            return (
              <div key={pair} className="pair-performance">
                <span className="pair-name">{pair}</span>
                <div className="pair-stats">
                  <span className="pair-details">
                    {pairTrades.length} trades • {pairWinRate}% WR
                  </span>
                  <span
                    className={`pair-pnl ${
                      pairPnL >= 0 ? 'positive' : 'negative'
                    }`}
                  >
                    {pairPnL > 0 ? '+' : ''}
                    {pairPnL.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="journal-details">
      <div className="journal-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <h2>{selectedJournal?.title || 'Journal'}</h2>

        <button
          className="add-trade-btn"
          onClick={() => {
            setEditTrade(null);
            setShowModal(true);
          }}
        >
          <PlusCircle size={18} />
          Add Trade
        </button>
      </div>

      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === 'table' ? 'active' : ''}`}
          onClick={() => setActiveView('table')}
        >
          <Table size={18} />
          Table View
        </button>
        <button
          className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <Calendar size={18} />
          Calendar
        </button>
        <button
          className={`view-tab ${activeView === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveView('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      <div className="filters-section">
        <div className="filters-header">
          <Filter size={18} />
          <h3>Filters</h3>
        </div>
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Search pair or strategy..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
          <select
            value={filters.pair}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, pair: e.target.value }))
            }
          >
            <option value="all">All Pairs</option>
            {Array.from(new Set(trades.map((t) => t.pair))).map((pair) => (
              <option key={pair} value={pair}>
                {pair}
              </option>
            ))}
          </select>
          <select
            value={filters.session}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, session: e.target.value }))
            }
          >
            <option value="all">All Sessions</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="Asian">Asian</option>
          </select>
          <select
            value={filters.strategy}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, strategy: e.target.value }))
            }
          >
            <option value="all">All Strategies</option>
            {Array.from(
              new Set(trades.map((t) => t.strategy).filter(Boolean))
            ).map((strategy) => (
              <option key={strategy} value={strategy}>
                {strategy}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
            }
            placeholder="From date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
            }
            placeholder="To date"
          />
        </div>
      </div>

      {activeView === 'table' && renderTableView()}
      {activeView === 'calendar' && renderCalendarView()}
      {activeView === 'analytics' && renderAnalyticsView()}

      {showModal && (
        <TradeModal
          onClose={() => {
            setShowModal(false);
            setEditTrade(null);
          }}
          onSave={handleSaveTrade}
          editData={editTrade}
          accountSize={
            selectedJournal.initialBalance || selectedJournal.accountSize
          }
        />
      )}

      {showScreenshotModal && (
        <ScreenshotModal
          screenshot={selectedScreenshot}
          onClose={() => {
            setShowScreenshotModal(false);
            setSelectedScreenshot(null);
          }}
        />
      )}
    </div>
  );
};

export default JournalDetails;
