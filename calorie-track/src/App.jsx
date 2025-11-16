import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getEntries, createEntry, updateEntry, deleteEntry } from './api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [showAuth, setShowAuth] = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Load today's entries
        await loadEntries();
      }
    });

    return () => unsubscribe();
  }, []);

  // Load entries for today
  const loadEntries = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const data = await getEntries(today);
      setEntries(data);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  // Sign up
  const handleSignUp = async (email, password, displayName) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Optionally update profile with displayName
      setShowAuth(false);
    } catch (error) {
      alert('Sign up failed: ' + error.message);
    }
  };

  // Sign in
  const handleSignIn = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuth(false);
    } catch (error) {
      alert('Sign in failed: ' + error.message);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
  };

  // Add entry
  const handleAddEntry = async (name, quantity, calories) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      await createEntry({ name, quantity, calories, date: today });
      await loadEntries();
    } catch (error) {
      alert('Failed to add entry: ' + error.message);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    try {
      await deleteEntry(id);
      await loadEntries();
    } catch (error) {
      alert('Failed to delete entry: ' + error.message);
    }
  };

  if (loading) return <div className="app">Loading...</div>;

  if (!user) {
    return (
      <div className="app">
        <h1>Calorie Track</h1>
        {!showAuth ? (
          <button onClick={() => setShowAuth(true)}>Sign In / Sign Up</button>
        ) : (
          <AuthForm onSignUp={handleSignUp} onSignIn={handleSignIn} />
        )}
      </div>
    );
  }

  return (
    <div className="app">
      <h1>Calorie Track</h1>
      <div className="user-info">
        <p>Welcome, {user.email}</p>
        <button onClick={handleSignOut}>Sign Out</button>
      </div>

      <EntryForm onAdd={handleAddEntry} />

      <div className="entries">
        <h2>Today's Entries</h2>
        {entries.length === 0 ? (
          <p>No entries yet</p>
        ) : (
          <ul>
            {entries.map((entry) => (
              <li key={entry.id}>
                <strong>{entry.name}</strong> ({entry.quantity}) - {entry.calories} cal
                <button onClick={() => handleDeleteEntry(entry.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
        <div className="total">
          Total: {entries.reduce((sum, e) => sum + e.calories, 0)} calories
        </div>
      </div>
    </div>
  );
}

// Auth Form Component
function AuthForm({ onSignUp, onSignIn }) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signin') {
      onSignIn(email, password);
    } else {
      onSignUp(email, password, displayName);
    }
  };

  return (
    <div className="auth-form">
      <h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Display Name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        )}
        <button type="submit">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</button>
      </form>
      <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
      </button>
    </div>
  );
}

// Entry Form Component
function EntryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [calories, setCalories] = useState('');

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
    <form className="entry-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Food name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
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
  );
}

export default App;
