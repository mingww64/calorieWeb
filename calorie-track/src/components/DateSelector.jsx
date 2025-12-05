import { useRef } from 'react';
import './DateSelector.css';

function DateSelector({ selectedDate, onDateChange }) {
  const dateInputRef = useRef(null);
  const today = new Date().toISOString().slice(0, 10);
  
  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    // Don't allow going beyond today
    const nextDate = date.toISOString().slice(0, 10);
    if (nextDate <= today) {
      onDateChange(nextDate);
    }
  };

  const handleToday = () => {
    onDateChange(today);
  };

  const handleDateClick = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isToday = selectedDate === today;
  const canGoForward = selectedDate < today;

  return (
    <div className="date-selector">
      <button onClick={handlePreviousDay} className="nav-btn">← Previous</button>
      <div className="date-display">
        <div className="date-picker-wrapper" onClick={handleDateClick}>
          <span className="date-text">{formatDate(selectedDate)}</span>
          <input 
            ref={dateInputRef}
            type="date" 
            value={selectedDate}
            max={today}
            onChange={(e) => onDateChange(e.target.value)}
            className="date-input-hidden"
          />
        </div>
        {!isToday && (
          <button onClick={handleToday} className="today-btn">Go to Today</button>
        )}
      </div>
      <button 
        onClick={handleNextDay} 
        className="nav-btn" 
        disabled={!canGoForward}
      >
        Next →
      </button>
    </div>
  );
}

export default DateSelector;
