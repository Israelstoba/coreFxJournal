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
  // ADD NEW JOURNAL
  // ========================
  const handleAddJournal = (newJournal) => {
    const journalWithMeta = {
      ...newJournal,
      id: Date.now(),
      dateCreated: new Date().toLocaleDateString(),
    };

    setJournals((prev) => [...prev, journalWithMeta]);
    setShowModal(false);
  };

  // ========================
  // DELETE JOURNAL + TRADES
  // ========================
  const handleDeleteJournal = (id) => {
    if (window.confirm('Are you sure you want to delete this journal?')) {
      setJournals((prev) => prev.filter((j) => j.id !== id));

      // remove linked trades
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
          <p>You don’t have any journals yet.</p>
          <button onClick={() => setShowModal(true)}>Create One</button>
        </div>
      ) : (
        <div className="journal-grid">
          {journals.map((journal) => (
            <JournalCard
              key={journal.id}
              journal={journal}
              onOpen={() => handleOpenJournal(journal)}
              onDelete={() => handleDeleteJournal(journal.id)}
            />
          ))}
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
