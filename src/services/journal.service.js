const Journal = require('../models/Journal');

/**
 * Create a new journal entry for a student.
 */
async function createEntry(userId, { title, body, prompt, tags }) {
  if (!body || !body.trim()) {
    const err = new Error('Journal body cannot be empty');
    err.statusCode = 400;
    throw err;
  }

  const entry = await Journal.create({
    userId,
    title: title?.trim() || 'Untitled Entry',
    body: body.trim(),
    prompt: prompt || null,
    tags: Array.isArray(tags) ? tags : []
  });

  return entry;
}

/**
 * Get all entries for a user, newest first.
 * Supports optional month/year filter for calendar view.
 *
 * @param {string} userId
 * @param {object} filters  — { year?, month? }  (month is 1-based)
 */
async function getEntries(userId, { year, month } = {}) {
  const query = { userId };

  if (year && month) {
    const start = new Date(year, month - 1, 1);          // 1st of month
    const end   = new Date(year, month, 1);               // 1st of next month
    query.createdAt = { $gte: start, $lt: end };
  } else if (year) {
    const start = new Date(year, 0, 1);
    const end   = new Date(year + 1, 0, 1);
    query.createdAt = { $gte: start, $lt: end };
  }

  const entries = await Journal.find(query)
    .sort({ createdAt: -1 })
    .select('_id title body prompt tags wordCount createdAt updatedAt');

  return entries;
}

/**
 * Get a single entry — ensures ownership.
 */
async function getEntryById(userId, entryId) {
  const entry = await Journal.findOne({ _id: entryId, userId });

  if (!entry) {
    const err = new Error('Journal entry not found');
    err.statusCode = 404;
    throw err;
  }

  return entry;
}

/**
 * Update an existing entry — only title, body, tags are editable.
 * updatedAt is set automatically by Mongoose timestamps.
 */
async function updateEntry(userId, entryId, { title, body, tags }) {
  const entry = await Journal.findOne({ _id: entryId, userId });

  if (!entry) {
    const err = new Error('Journal entry not found');
    err.statusCode = 404;
    throw err;
  }

  if (title !== undefined) entry.title = title.trim() || 'Untitled Entry';
  if (body  !== undefined) entry.body  = body.trim();
  if (tags  !== undefined) entry.tags  = Array.isArray(tags) ? tags : [];

  await entry.save(); // triggers wordCount pre-save hook

  return entry;
}

/**
 * Delete an entry — ensures ownership.
 */
async function deleteEntry(userId, entryId) {
  const result = await Journal.deleteOne({ _id: entryId, userId });

  if (result.deletedCount === 0) {
    const err = new Error('Journal entry not found');
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Calendar summary — returns an array of { date, count, entryIds }
 * for every day in a given month that has at least one entry.
 * Used by the frontend calendar to show active days.
 */
async function getCalendarSummary(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  const entries = await Journal.find(
    { userId, createdAt: { $gte: start, $lt: end } },
    { _id: 1, title: 1, createdAt: 1 }
  ).sort({ createdAt: 1 });

  // Group by local calendar date (YYYY-MM-DD)
  const dayMap = {};
  for (const e of entries) {
    const dateKey = e.createdAt.toISOString().slice(0, 10);
    if (!dayMap[dateKey]) dayMap[dateKey] = { date: dateKey, count: 0, entries: [] };
    dayMap[dateKey].count += 1;
    dayMap[dateKey].entries.push({ id: e._id, title: e.title });
  }

  return Object.values(dayMap);
}

/**
 * RAG preparation — returns all entries for a user in a given month
 * as plain text chunks: { entryId, date, text }
 * This is the surface the future RAG pipeline will call.
 */
async function getMonthlyEntriesForRAG(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 1);

  const entries = await Journal.find(
    { userId, createdAt: { $gte: start, $lt: end } },
    { _id: 1, title: 1, body: 1, prompt: 1, tags: 1, createdAt: 1 }
  ).sort({ createdAt: 1 });

  return entries.map((e) => ({
    entryId:   e._id,
    date:      e.createdAt.toISOString().slice(0, 10),
    title:     e.title,
    body:      e.body,
    prompt:    e.prompt,
    tags:      e.tags,
    wordCount: e.wordCount
  }));
}

module.exports = {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getCalendarSummary,
  getMonthlyEntriesForRAG
};