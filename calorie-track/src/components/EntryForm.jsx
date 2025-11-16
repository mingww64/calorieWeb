import React, { useState, useEffect } from 'react';
import { getFoodSuggestions } from '../api';

function EntryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
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

      const timer = setTimeout(fetchSuggestions, 300); // debounce
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
      onAdd(name, quantity || '1', parseInt(calories));
      setName('');
      setQuantity('');
      setCalories('');
    }
  };

  return (
    <div className="entry-form-container">
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
                  <strong>{sugg.name}</strong> - {sugg.calories} cal
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
        <button type="submit">Add Entry</button>
      </form>
    </div>
  );
}

export default EntryForm;
