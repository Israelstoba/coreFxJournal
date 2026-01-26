import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import JournalModal from '@/components/journal/JournalModal';
import JournalCard from '@/components/journal/JournalCard';
import JournalDetails from '@/pages/dashboard/JournalDetails';

const Journal = () => {
  const storageKey = 'corefx_journals';

  const [journals, setJournals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);

  // ========================
  // LOAD JOURNALS ON MOUNT
  // ========================
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setJournals(parsed);
        }
      }
    } catch (err) {
      console.error('Error loading journals:', err);
    }
  }, []);

  // ========================
  // SAVE JOURNALS ON CHANGE
  // ========================
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(journals));
    } catch (err) {
      console.error('Error saving journals:', err);
    }
  }, [journals]);

  // ========================
  // CALCULATE CURRENT BALANCE FROM TRADES
  // ========================
  const calculateCurrentBalance = (journalId, initialBalance) => {
    try {
      const tradesKey = `corefx_journal_${journalId}_trades`;
      const savedTrades = localStorage.getItem(tradesKey);

      if (!savedTrades) return initialBalance;

      const trades = JSON.parse(savedTrades);

      // Calculate total P&L in dollars
      const totalPnLDollars = trades.reduce((sum, trade) => {
        if (
          !trade.riskPercent ||
          !trade.entry ||
          !trade.sl ||
          (!trade.tp && !trade.exit)
        ) {
          return sum;
        }

        const entry = parseFloat(trade.entry);
        const sl = parseFloat(trade.sl);
        const tpOrExit = trade.exit
          ? parseFloat(trade.exit)
          : parseFloat(trade.tp);
        const isBuy = tpOrExit > entry;
        const risk = isBuy ? entry - sl : sl - entry;
        const reward = isBuy ? tpOrExit - entry : entry - tpOrExit;
        const rr = risk === 0 ? 0 : reward / risk;
        const pnlPercent = rr * parseFloat(trade.riskPercent);
        const pnlDollars = (initialBalance * pnlPercent) / 100;

        return sum + pnlDollars;
      }, 0);

      return initialBalance + totalPnLDollars;
    } catch (err) {
      console.error('Error calculating balance:', err);
      return initialBalance;
    }
  };

  // ========================
  // ADD NEW JOURNAL
  // ========================
  const handleAddJournal = (newJournal) => {
    const journalWithMeta = {
      ...newJournal,
      id: Date.now(),
      dateCreated: new Date().toLocaleDateString(),
      initialBalance: newJournal.accountSize, // Store initial balance separately
    };

    setJournals((prev) => [...prev, journalWithMeta]);
    setShowModal(false);
  };

  // ========================
  // UPDATE JOURNAL (Title, Type, Date)
  // ========================
  const handleUpdateJournal = (id, updates) => {
    setJournals((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
    );
  };

  // ========================
  // DELETE JOURNAL + TRADES
  // ========================
  const handleDeleteJournal = (id) => {
    if (
      window.confirm(
        'Are you sure you want to delete this journal? All trades will be lost.'
      )
    ) {
      setJournals((prev) => prev.filter((j) => j.id !== id));
      // Remove linked trades
      localStorage.removeItem(`corefx_journal_${id}_trades`);
    }
  };

  // ========================
  // OPEN SELECTED JOURNAL
  // ========================
  const handleOpenJournal = (journal) => {
    setSelectedJournal(journal);
  };

  const handleBack = () => {
    setSelectedJournal(null);
  };

  // ========================
  // SHOW JOURNAL DETAILS
  // ========================
  if (selectedJournal) {
    return (
      <JournalDetails
        selectedJournal={selectedJournal}
        onBack={handleBack}
        onUpdateJournal={handleUpdateJournal}
        key={selectedJournal.id}
      />
    );
  }

  // ========================
  // JOURNAL LIST VIEW
  // ========================
  return (
    <div className="journal-page">
      <div className="journal-header">
        <h2>My Journals</h2>

        <button className="add-journal-btn" onClick={() => setShowModal(true)}>
          <PlusCircle size={18} />
          Add Journal
        </button>
      </div>

      {journals.length === 0 ? (
        <div className="empty-state">
          <p>You don't have any journals yet.</p>
          <button onClick={() => setShowModal(true)}>Create One</button>
        </div>
      ) : (
        <div className="journal-grid">
          {journals.map((journal) => {
            const currentBalance = calculateCurrentBalance(
              journal.id,
              journal.initialBalance || journal.accountSize
            );

            return (
              <JournalCard
                key={journal.id}
                journal={{ ...journal, currentBalance }}
                onOpen={() => handleOpenJournal(journal)}
                onDelete={() => handleDeleteJournal(journal.id)}
                onUpdate={(updates) => handleUpdateJournal(journal.id, updates)}
              />
            );
          })}
        </div>
      )}

      {showModal && (
        <JournalModal
          onClose={() => setShowModal(false)}
          onSave={handleAddJournal}
        />
      )}
    </div>
  );
};

export default Journal;
