import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import TradeModal from '@/components/journal/TradeModal';
import TradeTable from '@/components/journal/TradeTable';

const JournalDetails = ({ selectedJournal, onBack }) => {
  const storageKey = `corefx_journal_${selectedJournal.id}_trades`;

  const [trades, setTrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editTrade, setEditTrade] = useState(null);

  // ============================
  // LOAD TRADES FROM LOCALSTORAGE
  // ============================
  useEffect(() => {
    const savedTrades = localStorage.getItem(storageKey);
    if (savedTrades) {
      setTrades(JSON.parse(savedTrades));
    }
  }, [selectedJournal.id]);

  // ============================
  // SAVE TRADES TO LOCALSTORAGE
  // ============================
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(trades));
  }, [trades]);

  // Add new trade
  const openAddModal = () => {
    setEditTrade(null);
    setShowModal(true);
  };

  // Edit trade
  const handleEdit = (trade) => {
    setEditTrade(trade);
    setShowModal(true);
  };

  // Save trade
  const handleSaveTrade = (trade) => {
    if (editTrade) {
      // UPDATE existing trade
      setTrades((prev) =>
        prev.map((t) =>
          t.id === editTrade.id ? { ...trade, id: editTrade.id } : t
        )
      );
      setEditTrade(null);
    } else {
      // ADD new trade
      setTrades((prev) => [...prev, { ...trade, id: Date.now() }]);
    }

    setShowModal(false);
  };

  // Delete trade
  const handleDelete = (id) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== id));
  };

  return (
    <div className="journal-details">
      <div className="journal-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Back
        </button>

        <h2>{selectedJournal?.title || 'My Journal'}</h2>

        <button className="add-trade-btn" onClick={openAddModal}>
          <PlusCircle size={18} />
          Add Trade
        </button>
      </div>

      {trades.length > 0 ? (
        <TradeTable
          trades={trades}
          onEdit={handleEdit}
          onDelete={handleDelete}
          accountSize={selectedJournal.accountSize}
        />
      ) : (
        <div className="no-trades">
          <p>No trades added yet. Click “Add Trade” to log your first one.</p>
        </div>
      )}

      {showModal && (
        <TradeModal
          onClose={() => {
            setShowModal(false);
            setEditTrade(null);
          }}
          onSave={handleSaveTrade}
          editData={editTrade}
        />
      )}
    </div>
  );
};

export default JournalDetails;
