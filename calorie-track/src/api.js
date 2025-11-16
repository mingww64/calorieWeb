// Frontend API client with Firebase token injection
import { auth } from './firebase';
import { API_URL } from './config';

/**
 * Fetch wrapper that automatically injects Firebase ID token
 */
export const apiFetch = async (endpoint, options = {}) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }

  const idToken = await user.getIdToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
};

/**
 * Fetch entries for a given date
 */
export const getEntries = (date) =>
  apiFetch(`/api/entries?date=${date}`);

/**
 * Create a new entry
 */
export const createEntry = (entry) =>
  apiFetch('/api/entries', {
    method: 'POST',
    body: JSON.stringify(entry),
  });

/**
 * Update an entry
 */
export const updateEntry = (id, entry) =>
  apiFetch(`/api/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(entry),
  });

/**
 * Delete an entry
 */
export const deleteEntry = (id) =>
  apiFetch(`/api/entries/${id}`, {
    method: 'DELETE',
  });

/**
 * Get daily calorie summary for date range
 */
export const getSummary = (startDate, endDate) =>
  apiFetch(`/api/summary?startDate=${startDate}&endDate=${endDate}`);

/**
 * Get current user info
 */
export const getMe = () =>
  apiFetch('/api/me');
