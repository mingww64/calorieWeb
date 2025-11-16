import { auth } from './firebase.js';
import db from './db.js';

/**
 * Middleware to verify Firebase ID token
 * Extracts userId from token and attaches to req.user
 */
export const verifyIdToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: no token provided' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };

    // Ensure a corresponding users row exists in the local DB so
    // inserts into `entries` with a foreign key to users.id won't fail. Ignore if exists.
    try {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, displayName, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `).run(decodedToken.uid, decodedToken.email || '', decodedToken.name || '', now, now);

      // Update profile fields if they have changed
      db.prepare(`
        UPDATE users SET email = ?, displayName = ?, updatedAt = ? WHERE id = ?
      `).run(decodedToken.email || '', decodedToken.name || '', now, decodedToken.uid);
    } catch (dbErr) {
      console.error('Failed to upsert user row for authenticated user:', dbErr);
      // don't block authentication; let requests proceed — entries inserts may still fail
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
};

/**
 * Middleware to handle errors globally
 */
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
};
