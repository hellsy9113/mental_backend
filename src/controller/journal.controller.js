const {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  getCalendarSummary,
  getMonthlyEntriesForRAG
} = require('../services/journal.service');

// POST /api/journal
async function create(req, res) {
  try {
    const entry = await createEntry(req.user.id, req.body);
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// GET /api/journal  — optionally ?year=2025&month=6
async function list(req, res) {
  try {
    const { year, month } = req.query;
    const filters = {};
    if (year)  filters.year  = parseInt(year, 10);
    if (month) filters.month = parseInt(month, 10);

    const entries = await getEntries(req.user.id, filters);
    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// GET /api/journal/:id
async function getOne(req, res) {
  try {
    const entry = await getEntryById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// PATCH /api/journal/:id
async function update(req, res) {
  try {
    const entry = await updateEntry(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// DELETE /api/journal/:id
async function remove(req, res) {
  try {
    await deleteEntry(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: 'Entry deleted' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// GET /api/journal/calendar?year=2025&month=6
async function calendar(req, res) {
  try {
    const year  = parseInt(req.query.year,  10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

    const summary = await getCalendarSummary(req.user.id, year, month);
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

// GET /api/journal/rag?year=2025&month=6  — internal, for future RAG pipeline
async function ragExport(req, res) {
  try {
    const year  = parseInt(req.query.year,  10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;

    const chunks = await getMonthlyEntriesForRAG(req.user.id, year, month);
    res.status(200).json({ success: true, data: chunks });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

module.exports = { create, list, getOne, update, remove, calendar, ragExport };