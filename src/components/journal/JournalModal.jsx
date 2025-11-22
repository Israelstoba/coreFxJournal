// src/components/journal/JournalModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import '../../styles/dashboard/_journal.scss';

const JournalModal = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Weekly');
  const [accountSize, setAccountSize] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !accountSize) return;

    const newJournal = {
      id: Date.now().toString(),
      title,
      type,
      accountSize: Number(accountSize),
      dateCreated: new Date().toLocaleDateString(),
      trades: [],
    };

    onSave(newJournal);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="journal-modal glassy-ctr">
        <header className="modal-header">
          <h2>Create New Journal</h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={22} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Journal Title */}
          <div className="input-group">
            <label>Journal Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 45 Journal"
              required
            />
          </div>

          {/* Journal Type */}
          <div className="input-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          {/* Account Size */}
          <div className="input-group">
            <label>Account Size ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Journal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JournalModal;
