/**
 * src/services/student.services.js  ── UPDATED
 *
 * Added:
 *   getStudentSessions   — student's own sessions with counsellor name attached
 *   getStudentCounsellor — the counsellor assigned to this student (via CounsellorProfile)
 */

const StudentDashboard  = require('../models/StudentDashboard');
const Session           = require('../models/Session');
const CounsellorProfile = require('../models/CounsellorProfile');
const User              = require('../models/User');

/* ── GET /dashboard/student ─────────────────────────────────── */
async function getStudentDashboard(userId) {
  const dashboard = await StudentDashboard.findOne({ userId });
  if (!dashboard) {
    const error = new Error('Student dashboard not found');
    error.statusCode = 404;
    throw error;
  }
  return dashboard;
}

/* ── PATCH /dashboard/student ───────────────────────────────── */
async function updateStudentDashboard(userId, updates) {
  const allowed = ['mentalStats', 'goals', 'journalEntries'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const dashboard = await StudentDashboard.findOneAndUpdate(
    { userId },
    { $set: sanitized },
    { new: true, runValidators: true }
  );

  if (!dashboard) {
    const error = new Error('Student dashboard not found');
    error.statusCode = 404;
    throw error;
  }
  return dashboard;
}

/* ── GET /dashboard/student/sessions ────────────────────────── */
/**
 * Returns all sessions for this student, with counsellor name attached.
 * Accepts optional query param: upcoming=true to filter future sessions only.
 */
async function getStudentSessions(userId, { upcoming } = {}) {
  const query = { studentId: userId };
  if (upcoming) query.scheduledAt = { $gte: new Date() };

  const sessions = await Session.find(query)
    .sort({ scheduledAt: upcoming ? 1 : -1 })
    .populate('counsellorId', 'name email');

  return sessions.map(s => ({
    ...s.toObject(),
    counsellorName:  s.counsellorId?.name  || '—',
    counsellorEmail: s.counsellorId?.email || '—',
  }));
}

/* ── GET /dashboard/student/counsellor ──────────────────────── */
/**
 * Finds the counsellor assigned to this student by searching CounsellorProfile
 * documents for ones whose assignedStudents array contains this student's userId.
 * Returns the counsellor's User record merged with their profile data (bio,
 * specialization, availability), or null if none is assigned yet.
 */
async function getStudentCounsellor(userId) {
  // Find the counsellor profile that has this student assigned
  const profile = await CounsellorProfile.findOne({ assignedStudents: userId })
    .populate('userId', 'name email institution');

  if (!profile || !profile.userId) return null;

  // Merge user fields + profile fields into one clean object
  const counsellorUser = profile.userId;
  return {
    _id:            counsellorUser._id,
    name:           counsellorUser.name,
    email:          counsellorUser.email,
    institution:    counsellorUser.institution,
    bio:            profile.bio            || '',
    specialization: profile.specialization || '',
    availability:   profile.availability   || [],
    isActive:       true,
  };
}

module.exports = {
  getStudentDashboard,
  updateStudentDashboard,
  getStudentSessions,
  getStudentCounsellor,
};