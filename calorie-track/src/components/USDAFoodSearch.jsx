import React, { useState } from 'react';
import { searchUSDAFoods, getUSDAFood } from '../api';

function USDAFoodSearch({ onFoodSelect, onCancel, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [fetchingNutrients, setFetchingNutrients] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setSearching(true);
    setSearchResult(null);
    
    try {
      const result = await searchUSDAFoods(query.trim());
      setSearchResult(result);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResult({ error: 'Search failed. Please try again.', suggestions: [] });
    } finally {
      setSearching(false);
    }
  };

  const handleFoodSelect = async (food) => {
    setFetchingNutrients(true);
    
    try {
      const result = await getUSDAFood(food.fdcId);
      
      if (result.error) {
        alert(`Error: ${result.error}`);
        return;
      }
      
      // Pass the nutrients back to parent
      onFoodSelect({
        name: result.nutrients.name,
        calories: result.nutrients.calories,
        protein: result.nutrients.protein,
        fat: result.nutrients.fat,
        carbs: result.nutrients.carbs,
        fromUSDA: true,
        usdaFdcId: result.nutrients.fdcId
      });
    } catch (error) {
      console.error('Failed to fetch nutrients:', error);
      alert('Failed to get nutrient data. Please try again.');
    } finally {
      setFetchingNutrients(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="usda-search-modal">
      <div className="usda-search-content">
        <div className="search-header">
          <h3>Search USDA Food Database</h3>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="search-input-section">
          <div className="search-input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for food (e.g., 'banana', 'cheddar cheese')"
              disabled={searching || fetchingNutrients}
            />
            <button 
              onClick={handleSearch}
              disabled={searching || fetchingNutrients || !query.trim()}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="search-tip">
            Tip: Be specific! Try "raw banana" or "cheddar cheese" for better results.
          </p>
        </div>

        {searchResult && (
          <div className="search-results">
            {searchResult.error ? (
              <div className="search-error">
                <p><strong>No results found:</strong> {searchResult.error}</p>
                <p>Try:</p>
                <ul>
                  <li>Different spelling or words</li>
                  <li>More specific terms (e.g., "raw apple" vs "apple")</li>
                  <li>Brand names for packaged foods</li>
                  <li>Common food names</li>
                </ul>
                <button onClick={onCancel} className="manual-entry-btn">
                  Enter Nutrition Data Manually
                </button>
              </div>
            ) : (
              <>
                <h4>Found {searchResult.suggestions.length} results:</h4>
                <div className="food-suggestions">
                  {searchResult.suggestions.map((food) => (
                    <div 
                      key={food.fdcId} 
                      className="food-suggestion-item"
                      onClick={() => handleFoodSelect(food)}
                      style={{ cursor: fetchingNutrients ? 'not-allowed' : 'pointer' }}
                    >
                      <div className="food-name">{food.name}</div>
                      <div className="food-details">
                        <span className="food-type">{food.dataType}</span>
                        {food.brandOwner && (
                          <span className="brand-owner"> • {food.brandOwner}</span>
                        )}
                        {!food.hasDetailedNutrients && (
                          <span className="nutrition-warning"> • Limited data</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="search-actions">
                  <button onClick={() => setQuery('')} className="new-search-btn">
                    Search Again
                  </button>
                  <button onClick={onCancel} className="manual-entry-btn">
                    Enter Manually Instead
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {fetchingNutrients && (
          <div className="loading-overlay">
            <p>Getting nutrition data...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default USDAFoodSearch;