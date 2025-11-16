import { useState, useEffect } from 'react';
import { getFoodSuggestions, searchUSDAFoods } from '../api';

function EntryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [suggestions, setSuggestions] = useState([]); // Local autocomplete
  const [usdaSuggestions, setUsdaSuggestions] = useState([]); // USDA search results
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null); // Selected food with source info
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [searchingUSDA, setSearchingUSDA] = useState(false);

  // Combined search: local autocomplete + USDA results
  useEffect(() => {
    if (name.length > 1) {
      const fetchSuggestions = async () => {
        try {
          // Get local autocomplete suggestions
          const localResults = await getFoodSuggestions(name, 3);
          setSuggestions(localResults);

          // Search USDA database
          setSearchingUSDA(true);
          const usdaResults = await searchUSDAFoods(name, 7);
          setUsdaSuggestions(usdaResults.suggestions || []);
          setSearchingUSDA(false);
          
          setShowSuggestions(true);
        } catch (error) {
          console.warn('Failed to fetch suggestions:', error);
          setSearchingUSDA(false);
        }
      };

      const timer = setTimeout(fetchSuggestions, 300); // debounce
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setUsdaSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name]);

  // Handle selecting a local food suggestion
  const handleSuggestionSelect = (suggestion) => {
    setName(suggestion.name);
    setCalories(suggestion.calories?.toString() || '');
    setProtein(suggestion.protein?.toString() || '');
    setFat(suggestion.fat?.toString() || '');
    setCarbs(suggestion.carbs?.toString() || '');
    setSelectedFood({ type: 'local', data: suggestion });
    setShowSuggestions(false);
  };

  // Handle selecting a USDA food with nutrition data
  const handleUSDASelect = (food) => {
    setName(food.name);
    setCalories(food.calories?.toString() || '');
    setProtein(food.protein?.toString() || '');
    setFat(food.fat?.toString() || '');
    setCarbs(food.carbs?.toString() || '');
    setSelectedFood({ type: 'usda', data: food });
    setShowSuggestions(false);
    setShowManualEntry(false);
  };

  // Show manual entry form
  const handleManualEntry = () => {
    setShowSuggestions(false);
    setShowManualEntry(true);
    setSelectedFood({ type: 'manual' });
  };

  // Clear selection and show suggestions again
  const handleNameChange = (e) => {
    const newName = e.target.value;
    setName(newName);
    
    // Clear nutrition data when name changes
    if (newName !== selectedFood?.data?.name) {
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setSelectedFood(null);
      setShowManualEntry(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && calories && protein && fat && carbs) {
      onAdd(name, quantity || '1', parseInt(calories), parseFloat(protein), parseFloat(fat), parseFloat(carbs));
      
      // Reset form
      setName('');
      setQuantity('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setSuggestions([]);
      setUsdaSuggestions([]);
      setShowSuggestions(false);
      setSelectedFood(null);
      setShowManualEntry(false);
    }
  };

  const isFormValid = name && calories && protein && fat && carbs;
  const hasNutritionData = calories || protein || fat || carbs;

  return (
    <form onSubmit={handleSubmit} className="entry-form">
      <div className="form-group">
        <label htmlFor="name">Food Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleNameChange}
          placeholder="Type a food name..."
          required
          autoComplete="off"
        />
        
        {/* Food Suggestions */}
        {showSuggestions && (suggestions.length > 0 || usdaSuggestions.length > 0) && (
          <div className="food-suggestions-dropdown">
            {/* Local suggestions first */}
            {suggestions.length > 0 && (
              <div className="suggestion-section">
                <div className="suggestion-header">Recent Foods</div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`local-${index}`}
                    className="suggestion-item local-suggestion"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="food-name">{suggestion.name}</div>
                    <div className="food-meta">
                      <span className="calories">{suggestion.calories} cal</span>
                      {suggestion.protein && (
                        <span className="macros">
                          P:{suggestion.protein}g F:{suggestion.fat}g C:{suggestion.carbs}g
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* USDA suggestions */}
            {usdaSuggestions.length > 0 && (
              <div className="suggestion-section">
                <div className="suggestion-header">
                  USDA Database {searchingUSDA && <span className="loading">Searching...</span>}
                </div>
                {usdaSuggestions.map((food) => (
                  <div
                    key={`usda-${food.fdcId}`}
                    className={`suggestion-item usda-suggestion ${!food.hasNutrients ? 'limited-nutrition' : ''}`}
                    onClick={() => handleUSDASelect(food)}
                  >
                    <div className="food-name">{food.name}</div>
                    <div className="food-meta">
                      <span className="food-type">{food.dataType}</span>
                      {food.brandOwner && <span className="brand-owner"> • {food.brandOwner}</span>}
                      {food.hasNutrients ? (
                        <span className="nutrition-preview">
                          {food.calories}cal • P:{food.protein}g F:{food.fat}g C:{food.carbs}g
                        </span>
                      ) : (
                        <span className="nutrition-warning"> • Limited nutrition data</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Manual entry option */}
            <div className="suggestion-section">
              <div
                className="suggestion-item manual-suggestion"
                onClick={handleManualEntry}
              >
                <div className="food-name">📝 Enter nutrition data manually</div>
                <div className="food-meta">For custom foods or if not found above</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="quantity">Quantity</label>
        <input
          type="text"
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1 serving, 100g, 1 cup..."
        />
      </div>

      {/* Nutrition Data Section */}
      {(hasNutritionData || showManualEntry || selectedFood) && (
        <div className="nutrition-section">
          <div className="nutrition-header">
            <h4>Nutrition Information</h4>
            {selectedFood && (
              <span className="data-source">
                {selectedFood.type === 'usda' && '🔬 USDA Data'}
                {selectedFood.type === 'local' && '💾 Saved Data'}
                {selectedFood.type === 'manual' && '✏️ Manual Entry'}
              </span>
            )}
          </div>
          
          <div className="nutrition-inputs">
            <div className="form-group">
              <label htmlFor="calories">Calories</label>
              <input
                type="number"
                id="calories"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="protein">Protein (g)</label>
              <input
                type="number"
                id="protein"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="fat">Fat (g)</label>
              <input
                type="number"
                id="fat"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="carbs">Carbs (g)</label>
              <input
                type="number"
                id="carbs"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                step="0.1"
                required
              />
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button type="submit" disabled={!isFormValid}>
          Add Entry
        </button>
        {selectedFood && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSelectedFood(null);
              setShowManualEntry(false);
              setCalories('');
              setProtein('');
              setFat('');
              setCarbs('');
            }}
          >
            Clear Selection
          </button>
        )}
      </div>
    </form>
  );
}

export default EntryForm;