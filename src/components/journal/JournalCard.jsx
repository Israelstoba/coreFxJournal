import React from 'react';
import { Trash2, FolderOpen } from 'lucide-react';

const JournalCard = ({ journal, onOpen, onDelete }) => {
  return (
    <div className="journal-card glassy-ctr">
      <div className="card-header">
        <h3 className="journal-title">{journal.title}</h3>
        <button
          className="delete-btn"
          onClick={() => onDelete(journal.id)}
          title="Delete Journal"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="journal-info">
        <p className="journal-type">{journal.type}</p>
        <p className="journal-date">Created: {journal.dateCreated}</p>

        {/* New: Account Size */}
        <p className="account-size">
          Account Size:{' '}
          <strong>${journal.accountSize?.toLocaleString()}</strong>
        </p>
      </div>

      <button className="open-btn" onClick={() => onOpen(journal.id)}>
        <FolderOpen size={16} />
        <span>View Journal</span>
      </button>
    </div>
  );
};

export default JournalCard;
