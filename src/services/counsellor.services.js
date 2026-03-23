/**
 * src/services/counsellor.services.js
 *
 * Complete replacement — safe to drop in.
 * Exports all 12 functions used by counsellor.controller.js:
 *
 *   Profile   : getCounsellorProfile, updateCounsellorProfile
 *   Students  : getAssignedStudentDashboard
 *   Sessions  : getSessions, createSession, updateSession, deleteSession
 *   Notes     : getNotes, createNote, updateNote, deleteNote
 *   Analytics : getAnalytics
 */

//for realtime communication
 const { notifyStudentSessionCreated, notifySessionUpdated } = require('../socket');

const CounsellorProfile = require('../models/CounsellorProfile');
const CounsellorNote    = require('../models/CounsellorNote');
const StudentDashboard  = require('../models/StudentDashboard');
const Session           = require('../models/Session');
const User              = require('../models/User');

/* ──────────────────────────────────────────────────────────────
   PROFILE
   ────────────────────────────────────────────────────────────── */

async function getCounsellorProfile(userId) {
  const profile = await CounsellorProfile.findOne({ userId })
    .populate('assignedStudents', 'name email institution course createdAt')
    .populate('assignedVolunteers',  'name email');

  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
}

async function updateCounsellorProfile(userId, updates) {
  const allowed = ['bio', 'specialization', 'availability'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  const profile = await CounsellorProfile.findOneAndUpdate(
    { userId },
    { $set: sanitized },
    { new: true, runValidators: true }
  );

  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
}

/* ──────────────────────────────────────────────────────────────
   STUDENT DASHBOARD VIEW
   ────────────────────────────────────────────────────────────── */

async function getAssignedStudentDashboard(counsellorUserId, studentUserId) {
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const isAssigned = profile.assignedStudents.some(
    id => id.toString() === studentUserId
  );
  if (!isAssigned) {
    const err = new Error('This student is not assigned to you');
    err.statusCode = 403;
    throw err;
  }

  const dashboard = await StudentDashboard.findOne({ userId: studentUserId });
  if (!dashboard) {
    const err = new Error('Student dashboard not found');
    err.statusCode = 404;
    throw err;
  }

  // Attach session history for this counsellor–student pair
  const sessionHistory = await Session.find({
    counsellorId: counsellorUserId,
    studentId:    studentUserId,
  })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .select('scheduledAt status durationMinutes type notes');

  return { ...dashboard.toObject(), sessionHistory };
}

/* ──────────────────────────────────────────────────────────────
   SESSIONS
   ────────────────────────────────────────────────────────────── */

async function getSessions(counsellorUserId, { limit, upcoming, studentId } = {}) {
  const query = { counsellorId: counsellorUserId };
  if (upcoming)  query.scheduledAt = { $gte: new Date() };
  if (studentId) query.studentId   = studentId;

  let q = Session.find(query)
    .sort({ scheduledAt: upcoming ? 1 : -1 })
    .populate('studentId', 'name email');

  if (limit) q = q.limit(Number(limit));

  const sessions = await q;
  return sessions.map(s => ({
    ...s.toObject(),
    studentName:  s.studentId?.name  || '—',
    studentEmail: s.studentId?.email || '—',
  }));
}

async function createSession(counsellorUserId, data) {
  const { studentId, scheduledAt, durationMinutes, type, notes } = data;
 
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }
 
  const isAssigned = profile.assignedStudents.some(
    id => id.toString() === studentId
  );
  if (!isAssigned) {
    const err = new Error('Cannot schedule a session with an unassigned student');
    err.statusCode = 403;
    throw err;
  }
 
  const counsellorUser = await User.findById(counsellorUserId).select('name institution');
 
  const session = await Session.create({
    counsellorId:    counsellorUserId,
    studentId,
    institution:     counsellorUser?.institution || '',
    scheduledAt:     new Date(scheduledAt),
    durationMinutes: durationMinutes || 50,
    type:            type            || 'video',
    notes:           notes           || '',
    status:          'scheduled',
  });
 
  // ── Real-time notification to student ─────────────────────────────────────
  // Fire-and-forget: if socket is not initialised (e.g. test env) the helper
  // silently no-ops, so this never throws.
  try {
    notifyStudentSessionCreated(studentId.toString(), {
      _id:             session._id,
      counsellorId:    counsellorUserId,
      counsellorName:  counsellorUser?.name || 'Your Counsellor',
      scheduledAt:     session.scheduledAt,
      durationMinutes: session.durationMinutes,
      type:            session.type,
      notes:           session.notes,
      status:          session.status,
    });
  } catch {
    // socket module not available in some environments — ignore
  }
 
  return session;
}

async function updateSession(counsellorUserId, sessionId, data) {
  const session = await Session.findOne({ _id: sessionId, counsellorId: counsellorUserId });
  if (!session) {
    const err = new Error('Session not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  const allowed = ['scheduledAt', 'durationMinutes', 'type', 'notes', 'status', 'summary'];
  for (const key of allowed) {
    if (data[key] !== undefined) session[key] = data[key];
  }

  await session.save();

  try {
    notifySessionUpdated(session.studentId.toString(), counsellorUserId.toString(), session.toObject());
  } catch (err) {
    // ignore socket notification errors
  }

  return session;
}

async function deleteSession(counsellorUserId, sessionId) {
  const session = await Session.findOne({ _id: sessionId, counsellorId: counsellorUserId });
  if (!session) {
    const err = new Error('Session not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  session.status = 'cancelled';
  await session.save();

  try {
    notifySessionUpdated(session.studentId.toString(), counsellorUserId.toString(), session.toObject());
  } catch (err) {
    // ignore socket notification errors
  }

  return session;
}

/* ──────────────────────────────────────────────────────────────
   NOTES  (private — visible only to the counsellor)
   ────────────────────────────────────────────────────────────── */

async function getNotes(counsellorUserId, studentId) {
  const query = { counsellorId: counsellorUserId };
  if (studentId) query.studentId = studentId;
  return CounsellorNote.find(query).sort({ updatedAt: -1 });
}

async function createNote(counsellorUserId, data) {
  const { studentId, title, content } = data;

  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const isAssigned = profile.assignedStudents.some(
    id => id.toString() === studentId
  );
  if (!isAssigned) {
    const err = new Error('Cannot create a note for an unassigned student');
    err.statusCode = 403;
    throw err;
  }

  return CounsellorNote.create({
    counsellorId: counsellorUserId,
    studentId,
    title:     title   || 'Untitled Note',
    content:   content || '',
    isPrivate: true,
  });
}

async function updateNote(counsellorUserId, noteId, data) {
  const note = await CounsellorNote.findOne({ _id: noteId, counsellorId: counsellorUserId });
  if (!note) {
    const err = new Error('Note not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.title   !== undefined) note.title   = data.title;
  if (data.content !== undefined) note.content = data.content;
  await note.save();
  return note;
}

async function deleteNote(counsellorUserId, noteId) {
  const note = await CounsellorNote.findOne({ _id: noteId, counsellorId: counsellorUserId });
  if (!note) {
    const err = new Error('Note not found');
    err.statusCode = 404;
    throw err;
  }
  await note.deleteOne();
  return { message: 'Note deleted' };
}

/* ──────────────────────────────────────────────────────────────
   ANALYTICS
   ────────────────────────────────────────────────────────────── */

async function getAnalytics(counsellorUserId) {
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId })
    .populate('assignedStudents', '_id');

  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const studentIds    = profile.assignedStudents.map(s => s._id);
  const totalStudents = studentIds.length;

  // ── Mood stats ────────────────────────────────────────────
  // Reads from StudentDashboard.mentalStats which is kept in sync
  // by mood.service.createMoodEntry — one document per student,
  // fast even at scale.
  const dashboards = await StudentDashboard.find({ userId: { $in: studentIds } });

  let goodCount = 0, fairCount = 0, lowCount = 0;
  let moodTotal = 0, moodCount = 0;
  const atRiskList = [];

  for (const d of dashboards) {
    const score = d.mentalStats?.moodScore;
    if (score != null && score > 0) {
      moodTotal += score;
      moodCount++;
      if (score >= 7)      goodCount++;
      else if (score >= 4) fairCount++;
      else                 lowCount++;

      if (score < 4) {
        const user = await User.findById(d.userId).select('name');
        atRiskList.push({
          name:        user?.name || '—',
          moodScore:   score,
          stressLevel: d.mentalStats?.stressLevel,
          lastCheckIn: d.mentalStats?.lastCheckIn,
          flagReason:  'Low mood score',
        });
      }
    }
  }

  const avgMoodScore = moodCount > 0
    ? parseFloat((moodTotal / moodCount).toFixed(1))
    : null;

  // ── Session stats ─────────────────────────────────────────
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allSessions, monthlySessions] = await Promise.all([
    Session.find({ counsellorId: counsellorUserId }),
    Session.find({ counsellorId: counsellorUserId, scheduledAt: { $gte: monthStart } }),
  ]);

  const completedCount = allSessions.filter(s => s.status === 'completed').length;
  const completionRate = allSessions.length
    ? Math.round((completedCount / allSessions.length) * 100)
    : 0;

  // Session type breakdown  e.g. { video: 4, chat: 2, 'in-person': 1 }
  const sessionTypeBreakdown = {};
  for (const s of allSessions) {
    const t = s.type || 'video';
    sessionTypeBreakdown[t] = (sessionTypeBreakdown[t] || 0) + 1;
  }

  // Weekly session volume — last 8 calendar weeks
  const weeklySessionVolume = [];
  for (let i = 7; i >= 0; i--) {
    const wStart = new Date(now);
    wStart.setDate(now.getDate() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 7);

    weeklySessionVolume.push({
      label: `W${8 - i}`,
      value: allSessions.filter(s => {
        const d = new Date(s.scheduledAt);
        return d >= wStart && d < wEnd;
      }).length,
    });
  }

  return {
    totalStudents,
    avgMoodScore,
    atRiskStudents:         atRiskList.length,
    atRiskList,
    completionRate,
    totalSessionsThisMonth: monthlySessions.length,
    weeklySessionVolume,
    sessionTypeBreakdown,
    moodDistribution: { good: goodCount, fair: fairCount, low: lowCount },
  };
}

/* ──────────────────────────────────────────────────────────────
   EXPORTS
   ────────────────────────────────────────────────────────────── */

module.exports = {
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
  getAnalytics,
};