import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'data.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`).run();

// Create entries table with userId foreign key
db.prepare(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    quantity TEXT,
    calories INTEGER NOT NULL,
    date TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// Create index for faster queries
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_entries_userId_date ON entries(userId, date)
`).run();

// Create foods table to track foods and calories for autocomplete
db.prepare(`
  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    usageCount INTEGER DEFAULT 1,
    lastUsed TEXT NOT NULL,
    FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(userId, name)
  )
`).run();

// Create index for faster food lookups
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_foods_userId_name ON foods(userId, name)
`).run();

export default db;
