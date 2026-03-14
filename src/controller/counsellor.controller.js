const {
  getCounsellorProfile,
  updateCounsellorProfile,
  getAssignedStudentDashboard,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getAnalytics
} = require('../services/counsellor.services');

/* ── Profile ──────────────────────────────────────────────── */

async function getProfile(req, res) {
  try {
    const profile = await getCounsellorProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function updateProfile(req, res) {
  try {
    const profile = await updateCounsellorProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── Student dashboard view ────────────────────────────────── */

async function viewStudentDashboard(req, res) {
  try {
    const data = await getAssignedStudentDashboard(req.user.id, req.params.studentId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── Sessions ─────────────────────────────────────────────── */

async function listSessions(req, res) {
  try {
    const { limit, upcoming, studentId } = req.query;
    const sessions = await getSessions(req.user.id, {
      limit,
      upcoming: upcoming === 'true',
      studentId
    });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function scheduleSession(req, res) {
  try {
    const session = await createSession(req.user.id, req.body);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function editSession(req, res) {
  try {
    const session = await updateSession(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function cancelSession(req, res) {
  try {
    const session = await deleteSession(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── Notes ────────────────────────────────────────────────── */

async function listNotes(req, res) {
  try {
    const notes = await getNotes(req.user.id, req.query.studentId);
    res.status(200).json({ success: true, data: notes });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function addNote(req, res) {
  try {
    const note = await createNote(req.user.id, req.body);
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function editNote(req, res) {
  try {
    const note = await updateNote(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, data: note });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

async function removeNote(req, res) {
  try {
    const result = await deleteNote(req.user.id, req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

/* ── Analytics ────────────────────────────────────────────── */

async function counsellorAnalytics(req, res) {
  try {
    const data = await getAnalytics(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  viewStudentDashboard,
  listSessions,
  scheduleSession,
  editSession,
  cancelSession,
  listNotes,
  addNote,
  editNote,
  removeNote,
  counsellorAnalytics
};