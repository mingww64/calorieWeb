import React, { useState, useEffect } from 'react';
import { getFoodSuggestions } from '../api';

function EditEntryForm({ entry, onSave, onCancel }) {
  const [name, setName] = useState(entry.name);
  const [quantity, setQuantity] = useState(entry.quantity);
  const [calories, setCalories] = useState(entry.calories);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch food suggestions on name change
  useEffect(() => {
    if (name.length > 1) {
      const fetchSuggestions = async () => {
        try {
          const results = await getFoodSuggestions(name, 5);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.warn('Failed to fetch suggestions:', error);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  const handleSelectSuggestion = (suggestion) => {
    setName(suggestion.name);
    setCalories(suggestion.calories);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && calories) {
      onSave(name, quantity, parseInt(calories), entry.id);
    }
  };

  return (
    <div className="entry-form-container">
      <h3>Edit Entry</h3>
      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Food name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => name.length > 1 && setShowSuggestions(true)}
            required
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((sugg, idx) => (
                <div
                  key={idx}
                  className="suggestion-item"
                  onClick={() => handleSelectSuggestion(sugg)}
                >
                  <div className="suggestion-main">
                    <strong>{sugg.name}</strong> - {sugg.calories} cal
                  </div>
                  {sugg.protein && (
                    <div className="suggestion-macros">
                      P: {sugg.protein}g | F: {sugg.fat}g | C: {sugg.carbs}g
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <input
          type="text"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          required
        />
        <button type="submit">Update Entry</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EditEntryForm;
