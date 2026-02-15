import React, { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import JournalModal from '@/components/journal/JournalModal';
import JournalCard from '@/components/journal/JournalCard';
import JournalDetails from '@/pages/dashboard/JournalDetails';
import FeatureGuard from '../../components/FeatureGuard';
import { useAuth } from '../../context/AuthContext';
import { databases } from '../../lib/appwrite';
import { Query, ID } from 'appwrite';

const Journal = () => {
  const { user } = useAuth();
  const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const TABLE_ID = import.meta.env.VITE_APPWRITE_JOURNALS_TABLE_ID;

  const [journals, setJournals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [loading, setLoading] = useState(true);

  // ========================
  // LOAD JOURNALS FROM APPWRITE
  // ========================
  useEffect(() => {
    const loadJournals = async () => {
      if (!user || !DATABASE_ID || !TABLE_ID) {
        setLoading(false);
        return;
      }

      try {
        const response = await databases.listDocuments(DATABASE_ID, TABLE_ID, [
          Query.equal('userId', user.$id),
        ]);

        const journalsWithTrades = response.documents.map((doc) => {
          const trades = doc.trades ? JSON.parse(doc.trades) : [];
          return {
            id: doc.$id,
            title: doc.title,
            type: doc.type,
            initialBalance: doc.initialBalance,
            accountSize: doc.initialBalance,
            dateCreated: doc.dateCreated,
            trades,
          };
        });

        setJournals(journalsWithTrades);
      } catch (error) {
        console.error('Error loading journals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJournals();
  }, [user, DATABASE_ID, TABLE_ID]);

  // ========================
  // CALCULATE CURRENT BALANCE FROM TRADES
  // ========================
  const getPipSize = (pair) => {
    if (!pair) return 0.0001;
    if (pair.includes('JPY')) return 0.01;
    if (pair.includes('XAU') || pair.includes('GOLD')) return 0.1;
    if (pair.includes('XAG')) return 0.001;
    if (
      [
        'US30',
        'US100',
        'US500',
        'UK100',
        'GER40',
        'FRA40',
        'JPN225',
        'AUS200',
        'HK50',
      ].includes(pair)
    )
      return 1;
    return 0.0001;
  };

  const getPipValue = (pair) => {
    if (!pair) return 10;
    if (pair.includes('JPY')) return 1000 / 150;
    if (pair.includes('XAU') || pair.includes('GOLD')) return 1;
    if (pair.includes('XAG')) return 0.1;
    if (
      [
        'US30',
        'US100',
        'US500',
        'UK100',
        'GER40',
        'FRA40',
        'JPN225',
        'AUS200',
        'HK50',
      ].includes(pair)
    )
      return 1;
    return 10;
  };

  const calculateCurrentBalance = (journal) => {
    try {
      const initialBalance = journal.initialBalance;
      const trades = journal.trades || [];

      if (trades.length === 0) return initialBalance;

      const totalPnLDollars = trades.reduce((sum, trade) => {
        if (!trade.entry || !trade.sl || !trade.lotSize || !trade.pair)
          return sum;

        const entry = parseFloat(trade.entry);
        const sl = parseFloat(trade.sl);
        const tpOrExit = trade.exit
          ? parseFloat(trade.exit)
          : parseFloat(trade.tp);
        if (!tpOrExit) return sum;

        const isBuy = tpOrExit > entry;
        const risk = isBuy ? entry - sl : sl - entry;
        const reward = isBuy ? tpOrExit - entry : entry - tpOrExit;
        const rr = risk === 0 ? 0 : reward / risk;

        const pipSize = getPipSize(trade.pair);
        const pipValue = getPipValue(trade.pair);
        const slPips = Math.abs(entry - sl) / pipSize;
        const riskDollars = slPips * pipValue * parseFloat(trade.lotSize);

        return sum + riskDollars * rr;
      }, 0);

      return initialBalance + totalPnLDollars;
    } catch (err) {
      console.error('Error calculating balance:', err);
      return journal.initialBalance;
    }
  };

  // ========================
  // ADD NEW JOURNAL
  // ========================
  const handleAddJournal = async (newJournal) => {
    if (!user || !DATABASE_ID || !TABLE_ID) return;

    try {
      const journalData = {
        userId: user.$id,
        title: newJournal.title,
        type: newJournal.type,
        initialBalance: newJournal.accountSize,
        dateCreated: new Date().toLocaleDateString(),
        trades: JSON.stringify([]),
      };

      const response = await databases.createDocument(
        DATABASE_ID,
        TABLE_ID,
        ID.unique(),
        journalData
      );

      const newJournalWithMeta = {
        id: response.$id,
        title: response.title,
        type: response.type,
        initialBalance: response.initialBalance,
        accountSize: response.initialBalance,
        dateCreated: response.dateCreated,
        trades: [],
      };

      setJournals((prev) => [...prev, newJournalWithMeta]);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating journal:', error);
      alert('Failed to create journal. Please try again.');
    }
  };

  // ========================
  // UPDATE JOURNAL (Title, Type, Trades)
  // ========================
  const handleUpdateJournal = async (id, updates) => {
    if (!DATABASE_ID || !TABLE_ID) return;

    try {
      const updateData = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.type) updateData.type = updates.type;
      if (updates.trades) updateData.trades = JSON.stringify(updates.trades);

      await databases.updateDocument(DATABASE_ID, TABLE_ID, id, updateData);

      setJournals((prev) =>
        prev.map((j) => (j.id === id ? { ...j, ...updates } : j))
      );
    } catch (error) {
      console.error('Error updating journal:', error);
      alert('Failed to update journal. Please try again.');
    }
  };

  // ========================
  // DELETE JOURNAL + TRADES
  // ========================
  const handleDeleteJournal = async (id) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this journal? All trades will be lost.'
      )
    ) {
      return;
    }

    if (!DATABASE_ID || !TABLE_ID) return;

    try {
      await databases.deleteDocument(DATABASE_ID, TABLE_ID, id);
      setJournals((prev) => prev.filter((j) => j.id !== id));
    } catch (error) {
      console.error('Error deleting journal:', error);
      alert('Failed to delete journal. Please try again.');
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
  // RENDER CONTENT (Protected by FeatureGuard)
  // ========================
  const renderContent = () => {
    // SHOW JOURNAL DETAILS
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

    // LOADING STATE
    if (loading) {
      return (
        <div className="journal-page">
          <div className="empty-state">
            <p>Loading journals...</p>
          </div>
        </div>
      );
    }

    // JOURNAL LIST VIEW
    return (
      <div className="journal-page">
        <div className="journal-header">
          <h2>My Journals</h2>

          <button
            className="add-journal-btn"
            onClick={() => setShowModal(true)}
          >
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
              const currentBalance = calculateCurrentBalance(journal);

              return (
                <JournalCard
                  key={journal.id}
                  journal={{ ...journal, currentBalance }}
                  onOpen={() => handleOpenJournal(journal)}
                  onDelete={() => handleDeleteJournal(journal.id)}
                  onUpdate={(updates) =>
                    handleUpdateJournal(journal.id, updates)
                  }
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

  // ========================
  // WRAP EVERYTHING IN FEATUREGUARD
  // ========================
  return <FeatureGuard feature="journal">{renderContent()}</FeatureGuard>;
};

export default Journal;
