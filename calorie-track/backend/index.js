import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import db from './db.js';
import { auth } from './firebase.js';
import { verifyIdToken, errorHandler } from './middleware.js';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// AUTH ROUTES (no token required)
// ============================================

/**
 * POST /api/auth/register
 * Create a new user in DB after Firebase creates the account
 * Body: { email, password, displayName }
 */
app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password required' });
    }

    // Create user in Firebase
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: displayName || '',
    });

    // Create user in local DB
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO users (id, email, displayName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(userRecord.uid, email, displayName || '', now, now);

    res.status(201).json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Response: instructions for frontend to get ID token via Firebase SDK
 */
app.post('/api/auth/login', async (req, res) => {
  res.json({
    message: 'Use Firebase SDK on frontend to authenticate. Call signInWithEmailAndPassword() and get ID token.',
  });
});

// ============================================
// PROTECTED ROUTES (require valid ID token)
// ============================================

/**
 * GET /api/me
 * Get current user info
 */
app.get('/api/me', verifyIdToken, (req, res) => {
  const user = db.prepare('SELECT id, email, displayName, createdAt FROM users WHERE id = ?').get(req.user.uid);
  res.json(user || { uid: req.user.uid, email: req.user.email });
});

/**
 * GET /api/entries?date=YYYY-MM-DD
 * Get today's entries for logged-in user
 */
app.get('/api/entries', verifyIdToken, (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const entries = db.prepare(`
    SELECT id, userId, name, quantity, calories, date, createdAt, updatedAt
    FROM entries
    WHERE userId = ? AND date = ?
    ORDER BY createdAt DESC
  `).all(req.user.uid, date);
  res.json(entries);
});

/**
 * GET /api/summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Get daily calorie totals for a date range
 */
app.get('/api/summary', verifyIdToken, (req, res) => {
  const startDate = req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = req.query.endDate || new Date().toISOString().slice(0, 10);

  const summary = db.prepare(`
    SELECT date, SUM(calories) as totalCalories, COUNT(*) as entryCount
    FROM entries
    WHERE userId = ? AND date BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date DESC
  `).all(req.user.uid, startDate, endDate);

  res.json(summary);
});

/**
 * POST /api/entries
 * Create a new entry
 * Body: { name, quantity, calories, date? }
 */
app.post('/api/entries', verifyIdToken, (req, res, next) => {
  try {
    const { name, quantity, calories, date } = req.body;

    if (!name || calories == null) {
      return res.status(400).json({ error: 'name and calories required' });
    }

    const now = new Date().toISOString();
    const entryDate = date || now.slice(0, 10);

    const info = db.prepare(`
      INSERT INTO entries (userId, name, quantity, calories, date, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.uid, name, quantity || '', Number(calories), entryDate, now, now);

    const entry = db.prepare('SELECT * FROM entries WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/entries/:id
 * Update an entry (must own it)
 */
app.put('/api/entries/:id', verifyIdToken, (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { name, quantity, calories, date } = req.body;

    // Verify ownership
    const entry = db.prepare('SELECT userId FROM entries WHERE id = ?').get(id);
    if (!entry || entry.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: you do not own this entry' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE entries
      SET name = ?, quantity = ?, calories = ?, date = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, quantity, Number(calories), date, now, id);

    const updated = db.prepare('SELECT * FROM entries WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry (must own it)
 */
app.delete('/api/entries/:id', verifyIdToken, (req, res, next) => {
  try {
    const id = Number(req.params.id);

    // Verify ownership
    const entry = db.prepare('SELECT userId FROM entries WHERE id = ?').get(id);
    if (!entry || entry.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden: you do not own this entry' });
    }

    db.prepare('DELETE FROM entries WHERE id = ?').run(id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`🚀 Calorie Track API listening on http://localhost:${port}`);
  console.log(`   Health: GET http://localhost:${port}/health`);
});
