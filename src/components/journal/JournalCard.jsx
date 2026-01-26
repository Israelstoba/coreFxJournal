import React, { useState } from 'react';
import { Trash2, FolderOpen, Edit2, Check, X } from 'lucide-react';

const JournalCard = ({ journal, onOpen, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: journal.title,
    type: journal.type,
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      title: journal.title,
      type: journal.type,
    });
  };

  const handleSave = () => {
    if (!editForm.title.trim()) {
      alert('Title cannot be empty');
      return;
    }
    onUpdate(editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      title: journal.title,
      type: journal.type,
    });
  };

  const pnl =
    journal.currentBalance - (journal.initialBalance || journal.accountSize);
  const pnlPercent = (
    (pnl / (journal.initialBalance || journal.accountSize)) *
    100
  ).toFixed(2);

  return (
    <div className="journal-card glassy-ctr">
      <div className="card-header">
        {isEditing ? (
          <input
            type="text"
            className="edit-title-input"
            value={editForm.title}
            onChange={(e) =>
              setEditForm({ ...editForm, title: e.target.value })
            }
            autoFocus
          />
        ) : (
          <h3 className="journal-title">{journal.title}</h3>
        )}

        <div className="card-actions">
          {isEditing ? (
            <>
              <button
                className="save-btn"
                onClick={handleSave}
                title="Save Changes"
              >
                <Check size={16} />
              </button>
              <button
                className="cancel-edit-btn"
                onClick={handleCancel}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                className="edit-btn"
                onClick={handleEdit}
                title="Edit Journal"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="delete-btn"
                onClick={() => onDelete(journal.id)}
                title="Delete Journal"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="journal-info">
        {isEditing ? (
          <select
            className="edit-type-select"
            value={editForm.type}
            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
          >
            <option value="Weekly">Weekly</option>
            <option value="Monthly">Monthly</option>
            <option value="Daily">Daily</option>
          </select>
        ) : (
          <p className="journal-type">{journal.type}</p>
        )}

        <p className="journal-date">Created: {journal.dateCreated}</p>

        {/* Initial Balance */}
        <p className="initial-balance">
          Initial:{' '}
          <strong>
            ${(journal.initialBalance || journal.accountSize).toLocaleString()}
          </strong>
        </p>

        {/* Current Balance */}
        <p className="current-balance">
          Current:{' '}
          <strong>
            $
            {journal.currentBalance.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </p>

        {/* P&L */}
        <p className={`pnl ${pnl >= 0 ? 'profit' : 'loss'}`}>
          P&L:{' '}
          <strong>
            {pnl >= 0 ? '+' : ''}$
            {pnl.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ({pnl >= 0 ? '+' : ''}
            {pnlPercent}%)
          </strong>
        </p>
      </div>

      {!isEditing && (
        <button className="open-btn" onClick={() => onOpen(journal.id)}>
          <FolderOpen size={16} />
          <span>View Journal</span>
        </button>
      )}
    </div>
  );
};

export default JournalCard;
