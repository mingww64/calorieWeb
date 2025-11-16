import React, { useState, useEffect } from 'react';
import { getFoodSuggestions } from '../api';
import USDAFoodSearch from './USDAFoodSearch';

function EntryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUSDASearch, setShowUSDASearch] = useState(false);
  const [macrosSource, setMacrosSource] = useState(''); // 'usda', 'manual', or ''

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
    if (suggestion.protein) {
      setProtein(suggestion.protein);
      setFat(suggestion.fat);
      setCarbs(suggestion.carbs);
      setMacrosSource('cached');
    }
    setShowSuggestions(false);
  };

  const handleUSDAFoodSelect = (foodData) => {
    setName(foodData.name);
    setCalories(foodData.calories);
    setProtein(foodData.protein);
    setFat(foodData.fat);
    setCarbs(foodData.carbs);
    setMacrosSource('usda');
    setShowUSDASearch(false);
  };

  const handleManualEntry = () => {
    setMacrosSource('manual');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && calories && protein && fat && carbs) {
      onAdd(name, quantity || '1', parseInt(calories), parseFloat(protein), parseFloat(fat), parseFloat(carbs));
      setName('');
      setQuantity('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setMacrosSource('');
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

        {/* Macro nutrition section */}
        {macrosSource === '' && name && calories && (
          <div className="macros-prompt">
            <p>Nutrition data required. Choose an option:</p>
            <div className="macros-buttons">
              <button type="button" onClick={() => setShowUSDASearch(true)} className="usda-search-btn">
                🔍 Search USDA Database
              </button>
              <button type="button" onClick={handleManualEntry} className="manual-entry-btn">
                ✏️ Enter Manually
              </button>
            </div>
          </div>
        )}

        {macrosSource === 'manual' && (
          <div className="manual-macros">
            <h4>Enter nutrition data manually (per serving):</h4>
            <div className="macros-inputs">
              <input
                type="number"
                step="0.1"
                placeholder="Protein (g)"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Fat (g)"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                required
              />
              <input
                type="number"
                step="0.1"
                placeholder="Carbs (g)"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                required
              />
            </div>
            <button type="button" onClick={() => setMacrosSource('')} className="change-method-btn">
              Use USDA Search Instead
            </button>
          </div>
        )}

        {(macrosSource === 'usda' || macrosSource === 'cached') && (
          <div className="macros-display">
            <h4>Nutrition data {macrosSource === 'usda' ? '(from USDA)' : '(cached)'}:</h4>
            <div className="macros-summary">
              <span>Protein: {protein}g</span>
              <span>Fat: {fat}g</span>
              <span>Carbs: {carbs}g</span>
            </div>
            <button type="button" onClick={() => setMacrosSource('')} className="change-method-btn">
              Change Nutrition Data
            </button>
          </div>
        )}

        <button 
          type="submit" 
          disabled={!name || !calories || !protein || !fat || !carbs}
          className={(!name || !calories || !protein || !fat || !carbs) ? 'disabled' : ''}
        >
          Add Entry
        </button>
      </form>

      {showUSDASearch && (
        <USDAFoodSearch
          initialQuery={name}
          onFoodSelect={handleUSDAFoodSelect}
          onCancel={() => setShowUSDASearch(false)}
        />
      )}
    </div>
  );
}

export default EntryForm;
