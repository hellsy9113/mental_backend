/**
 * src/controller/student.controller.js  ── UPDATED
 *
 * Added:
 *   listStudentSessions   → GET /dashboard/student/sessions
 *   getAssignedCounsellor → GET /dashboard/student/counsellor
 */

const {
  getStudentDashboard,
  updateStudentDashboard,
  getStudentSessions,
  getStudentCounsellor,
} = require('../services/student.services');

/* ── GET /dashboard/student ─────────────────────────────────── */
async function studentDashBoard(req, res) {
  try {
    const dashboard = await getStudentDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/* ── PATCH /dashboard/student ───────────────────────────────── */
async function updateDashboard(req, res) {
  try {
    const dashboard = await updateStudentDashboard(req.user.id, req.body);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/* ── GET /dashboard/student/sessions ────────────────────────── */
async function listStudentSessions(req, res) {
  try {
    const upcoming = req.query.upcoming === 'true';
    const sessions = await getStudentSessions(req.user.id, { upcoming });
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

/* ── GET /dashboard/student/counsellor ──────────────────────── */
async function getAssignedCounsellor(req, res) {
  try {
    const counsellor = await getStudentCounsellor(req.user.id);
    res.status(200).json({ success: true, data: counsellor });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}

module.exports = {
  studentDashBoard,
  updateDashboard,
  listStudentSessions,
  getAssignedCounsellor,
};