import React from 'react';

function EntryList({ entries, onEdit, onDelete }) {
  return (
    <div className="entries">
      <h2>Today's Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.name}</strong> ({entry.quantity}) - {entry.calories} cal
              <div className="entry-actions">
                <button className="edit-btn" onClick={() => onEdit(entry.id)}>
                  Edit
                </button>
                <button className="delete-btn" onClick={() => onDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="total">
        Total: {entries.reduce((sum, e) => sum + e.calories, 0)} calories
      </div>
    </div>
  );
}

export default EntryList;
