import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './EntryList.css';

function EntryList({ entries, onEdit, onDelete }) {
  const { total, chartData } = useMemo(() => {
    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein || 0),
      fat: acc.fat + (entry.fat || 0),
      carbs: acc.carbs + (entry.carbs || 0)
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

    const data = [
      { name: 'Protein', value: totals.protein, color: '#FF8042' },
      { name: 'Fat', value: totals.fat, color: '#FFBB28' },
      { name: 'Carbs', value: totals.carbs, color: '#00C49F' }
    ].filter(item => item.value > 0);

    return { total: totals, chartData: data };
  }, [entries]);

  return (
    <div className="entries">
      <h2>Today's Entries</h2>
      {entries.length === 0 ? (
        <p>No entries yet</p>
      ) : (
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <div className="entry-content">
                <div className="entry-left">
                  <strong className="entry-name">{entry.name}</strong>
                  <span className="entry-quantity">{entry.quantity}</span>
                </div>
                {(entry.protein != null || entry.fat != null || entry.carbs != null) && (
                  <div className="entry-macros">
                    {entry.protein != null && <span className="macro protein">🥩 {entry.protein}g</span>}
                    {entry.fat != null && <span className="macro fat">🧈 {entry.fat}g</span>}
                    {entry.carbs != null && <span className="macro carbs">🌾 {entry.carbs}g</span>}
                  </div>
                )}
                <span className="entry-calories">{entry.calories} cal</span>
                <div className="entry-actions">
                  <button className="edit-btn" onClick={() => onEdit(entry.id)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => onDelete(entry.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="total">
        {chartData.length > 0 && (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `${value}g`}
                  contentStyle={{ backgroundColor: '#333', borderColor: '#555', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        <span>Total: {total.calories} calories</span>
      </div>
    </div>
  );
}

export default EntryList;
