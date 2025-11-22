import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TradeModal = ({
  onClose,
  onSave,
  savedPairs = [],
  savedStrategies = [],
  editData = null,
}) => {
  const [form, setForm] = useState({
    date: '',
    pair: '',
    entry: '',
    sl: '',
    tp: '',
    exit: '',
    lotSize: '',
    riskPercent: '',
    session: '',
    strategy: '',
    entryReason: '',
  });

  useEffect(() => {
    if (editData) {
      setForm({
        date: editData.date || '',
        pair: editData.pair || '',
        entry: editData.entry || '',
        sl: editData.sl || '',
        tp: editData.tp || '',
        exit: editData.exit || '',
        lotSize: editData.lotSize || '',
        riskPercent: editData.riskPercent || '',
        session: editData.session || '',
        strategy: editData.strategy || '',
        entryReason: editData.entryReason || '',
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.pair ||
      !form.entry ||
      !form.sl ||
      !form.tp ||
      !form.date ||
      !form.lotSize ||
      !form.riskPercent
    ) {
      alert('Please fill all required fields including Lot Size and Risk %.');
      return;
    }

    const tradePayload = {
      ...form,
      id: editData ? editData.id : Date.now(),
    };

    onSave(tradePayload);
  };

  return (
    <div className="modal-overlay">
      <div className="trade-modal glassy-ctr">
        <div className="modal-header">
          <h3>{editData ? 'Edit Trade' : 'Add Trade'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="trade-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Pair *</label>
              <select name="pair" value={form.pair} onChange={handleChange}>
                <option value="">Select Pair</option>
                {(savedPairs.length > 0
                  ? savedPairs
                  : ['GBP/JPY', 'GBP/USD', 'EUR/USD', 'USD/JPY']
                ).map((p, i) => (
                  <option key={i} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Entry *</label>
              <input
                type="number"
                name="entry"
                step="0.001"
                value={form.entry}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>SL *</label>
              <input
                type="number"
                name="sl"
                step="0.001"
                value={form.sl}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>TP *</label>
              <input
                type="number"
                name="tp"
                step="0.001"
                value={form.tp}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Exit Price</label>
              <input
                type="number"
                name="exit"
                step="0.001"
                value={form.exit}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Lot Size *</label>
              <input
                type="number"
                name="lotSize"
                step="0.01"
                value={form.lotSize}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Risk % *</label>
              <input
                type="number"
                name="riskPercent"
                step="0.1"
                value={form.riskPercent}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Session</label>
              <select
                name="session"
                value={form.session}
                onChange={handleChange}
              >
                <option value="">Select Session</option>
                <option value="London">London</option>
                <option value="New York">New York</option>
                <option value="Asian">Asian</option>
              </select>
            </div>

            <div>
              <label>Strategy</label>
              <select
                name="strategy"
                value={form.strategy}
                onChange={handleChange}
              >
                <option value="">Select Strategy</option>
                {(savedStrategies.length > 0
                  ? savedStrategies
                  : ['Break & Retest', 'Liquidity Grab', 'Trend Continuation']
                ).map((s, i) => (
                  <option key={i} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <label>Entry Reason</label>
            <textarea
              name="entryReason"
              value={form.entryReason}
              onChange={handleChange}
              rows={3}
              placeholder="Optional notes..."
            />
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

export default TradeModal;
