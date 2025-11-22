import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const TradeTable = ({ trades, onEdit, onDelete }) => {
  const calculateRR = (trade) => {
    if (!trade.entry || !trade.sl || (!trade.tp && !trade.exit)) return '-';

    const entry = parseFloat(trade.entry);
    const sl = parseFloat(trade.sl);
    const tpOrExit = trade.exit ? parseFloat(trade.exit) : parseFloat(trade.tp);

    const isBuy = tpOrExit > entry;

    const risk = isBuy ? entry - sl : sl - entry;
    const reward = isBuy ? tpOrExit - entry : entry - tpOrExit;

    if (risk === 0) return '-';

    return (reward / risk).toFixed(2);
  };

  const calculatePnLPercent = (trade) => {
    if (!trade.riskPercent) return '-';

    const rr = calculateRR(trade);
    if (rr === '-') return '-';

    return (parseFloat(rr) * parseFloat(trade.riskPercent)).toFixed(2);
  };

  const rrClass = (rr) => {
    if (rr === '-') return '';
    const val = parseFloat(rr);
    if (val >= 2) return 'rr-good';
    if (val >= 1) return 'rr-mid';
    return 'rr-bad';
  };

  return (
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
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td colSpan="13" className="empty-table">
                  No trades logged yet.
                </td>
              </tr>
            ) : (
              trades.map((trade) => {
                const rr = calculateRR(trade);
                const pnl = calculatePnLPercent(trade);

                return (
                  <tr key={trade.id}>
                    <td>{trade.date}</td>
                    <td>{trade.pair}</td>
                    <td>{trade.session || '-'}</td>
                    <td>{trade.entry}</td>
                    <td>{trade.sl}</td>
                    <td>{trade.tp}</td>
                    <td>{trade.exit || '-'}</td>

                    <td className={rrClass(rr)}>{rr}</td>

                    <td
                      className={
                        pnl !== '-' && parseFloat(pnl) > 0
                          ? 'positive'
                          : pnl !== '-' && parseFloat(pnl) < 0
                          ? 'negative'
                          : ''
                      }
                    >
                      {pnl !== '-' ? `${pnl}%` : '-'}
                    </td>

                    <td>{trade.strategy || '-'}</td>
                    <td>{trade.entryReason || '-'}</td>

                    <td className="action-btns">
                      <button className="edit" onClick={() => onEdit(trade)}>
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="delete"
                        onClick={() => onDelete(trade.id)}
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
};

export default TradeTable;
