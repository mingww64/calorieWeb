import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  registerUser,
} from './api';
import AuthForm from './components/AuthForm';
import EntryForm from './components/EntryForm';
import EditEntryForm from './components/EditEntryForm';
import EntryList from './components/EntryList';
import UserHeader from './components/UserHeader';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Load today's entries
        await loadEntries();
        // Optional: register user in local DB
        try {
          await registerUser(currentUser.displayName);
        } catch (err) {
          console.warn('User already registered or error:', err);
        }
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
      alert('Failed to load entries: ' + error.message);
    }
  };

  // Sign up
  const handleSignUp = async (email, password, displayName) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Update user profile with displayName
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
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

  // Add or update entry
  const handleSaveEntry = async (name, quantity, calories, editId = null) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      if (editId) {
        await updateEntry(editId, { name, quantity, calories, date: today });
      } else {
        await createEntry({ name, quantity, calories, date: today });
      }
      await loadEntries();
      setEditingId(null);
    } catch (error) {
      alert('Failed to save entry: ' + error.message);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id) => {
    if (window.confirm('Delete this entry?')) {
      try {
        await deleteEntry(id);
        await loadEntries();
      } catch (error) {
        alert('Failed to delete entry: ' + error.message);
      }
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
      <UserHeader user={user} onSignOut={handleSignOut} />

      {editingId ? (
        <EditEntryForm
          entry={entries.find((e) => e.id === editingId)}
          onSave={handleSaveEntry}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <EntryForm onAdd={handleSaveEntry} />
      )}

      <EntryList
        entries={entries}
        onEdit={setEditingId}
        onDelete={handleDeleteEntry}
      />
    </div>
  );
}

export default App;
