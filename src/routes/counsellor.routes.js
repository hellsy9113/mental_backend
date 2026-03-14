const express = require('express');
const {
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
} = require('../controller/counsellor.controller');
const { verifyToken, isCounsellor } = require('../middleware/auth.middleware');

const router = express.Router();

// All counsellor routes require authentication + counsellor role
router.use(verifyToken, isCounsellor);

/* ── Profile ──────────────────────────────────────────────── */
router.get   ('/profile',  getProfile);
router.patch ('/profile',  updateProfile);

/* ── Student dashboard view ───────────────────────────────── */
router.get('/students/:studentId', viewStudentDashboard);

/* ── Sessions ─────────────────────────────────────────────── */
// GET  /counsellor/sessions?upcoming=true&limit=5&studentId=xxx
router.get   ('/sessions',     listSessions);
// POST /counsellor/sessions  { studentId, scheduledAt, durationMinutes, type, notes }
router.post  ('/sessions',     scheduleSession);
// PATCH /counsellor/sessions/:id
router.patch ('/sessions/:id', editSession);
// DELETE /counsellor/sessions/:id  (sets status=cancelled)
router.delete('/sessions/:id', cancelSession);

/* ── Notes (private) ─────────────────────────────────────── */
// GET  /counsellor/notes?studentId=xxx
router.get   ('/notes',     listNotes);
// POST /counsellor/notes  { studentId, title, content }
router.post  ('/notes',     addNote);
// PATCH /counsellor/notes/:id
router.patch ('/notes/:id', editNote);
// DELETE /counsellor/notes/:id
router.delete('/notes/:id', removeNote);

/* ── Analytics ────────────────────────────────────────────── */
// GET /counsellor/analytics
router.get('/analytics', counsellorAnalytics);

module.exports = router;