import React, { useMemo } from 'react';

function Analysis({ entries }) {
  const CALORIE_GOAL = 2000; // Default daily goal
  
  const stats = useMemo(() => {
    const total = entries.reduce((sum, entry) => sum + entry.calories, 0);
    const remaining = CALORIE_GOAL - total;
    const percentage = Math.round((total / CALORIE_GOAL) * 100);
    
    // Calculate actual macros from entries
    // If macros aren't available, estimate based on calorie distribution
    let protein = 0;
    let fat = 0;
    let carbs = 0;
    let hasActualMacros = false;

    for (const entry of entries) {
      if (entry.protein !== null && entry.protein !== undefined) {
        protein += entry.protein;
        fat += (entry.fat || 0);
        carbs += (entry.carbs || 0);
        hasActualMacros = true;
      }
    }

    // If we don't have actual macro data, estimate from calories
    if (!hasActualMacros) {
      protein = Math.round((total * 0.25) / 4); // 25% of calories / 4 cal/g
      fat = Math.round((total * 0.35) / 9);     // 35% of calories / 9 cal/g
      carbs = Math.round((total * 0.40) / 4);   // 40% of calories / 4 cal/g
    }
    
    return {
      total,
      remaining,
      percentage,
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      entryCount: entries.length,
      hasActualMacros
    };
  }, [entries]);

  const getStatusColor = (percentage) => {
    if (percentage < 80) return '#ffc107'; // Yellow - under goal
    if (percentage <= 110) return '#28a745'; // Green - on track
    return '#dc3545'; // Red - over goal
  };

  return (
    <div className="analysis-section">
      <h2>Daily Analysis</h2>
      
      <div className="stats-grid">
        {/* Calorie Summary */}
        <div className="stat-card calorie-card">
          <div className="stat-header">Total Calories</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-subtext">Goal: {CALORIE_GOAL}</div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{
                width: `${Math.min(stats.percentage, 100)}%`,
                backgroundColor: getStatusColor(stats.percentage)
              }}
            />
          </div>
          
          <div className="stat-footer">
            {stats.remaining > 0 ? (
              <span className="remaining-positive">{stats.remaining} cal remaining</span>
            ) : (
              <span className="remaining-negative">{Math.abs(stats.remaining)} cal over</span>
            )}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className="stat-card macro-card">
          <div className="stat-header">Macronutrients {stats.hasActualMacros ? '' : '(Est.)'}</div>
          <div className="macro-row">
            <div className="macro-item">
              <span className="macro-label">Protein</span>
              <span className="macro-value">{stats.protein}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Fat</span>
              <span className="macro-value">{stats.fat}g</span>
            </div>
            <div className="macro-item">
              <span className="macro-label">Carbs</span>
              <span className="macro-value">{stats.carbs}g</span>
            </div>
          </div>
          {!stats.hasActualMacros && <div className="macro-note">*Estimates based on calorie distribution</div>}
          {stats.hasActualMacros && <div className="macro-note">*Based on USDA food data</div>}
        </div>

        {/* Quick Stats */}
        <div className="stat-card quick-stats">
          <div className="stat-header">Quick Stats</div>
          <div className="quick-stat-row">
            <span>Entries Today:</span>
            <span className="stat-value-small">{stats.entryCount}</span>
          </div>
          <div className="quick-stat-row">
            <span>Goal Progress:</span>
            <span className="stat-value-small">{stats.percentage}%</span>
          </div>
          <div className="quick-stat-row">
            <span>Status:</span>
            <span className={`status-badge ${stats.percentage < 80 ? 'under' : stats.percentage <= 110 ? 'on-track' : 'over'}`}>
              {stats.percentage < 80 ? 'Under Goal' : stats.percentage <= 110 ? 'On Track' : 'Over Goal'}
            </span>
          </div>
        </div>
      </div>

      {entries.length === 0 && (
        <div className="empty-message">
          No entries for this day. Add your first entry to see analysis!
        </div>
      )}
    </div>
  );
}

export default Analysis;
