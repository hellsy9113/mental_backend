const CounsellorProfile = require('../models/CounsellorProfile');
const StudentDashboard  = require('../models/StudentDashboard');
const Session           = require('../models/Session');
const CounsellorNote    = require('../models/CounsellorNote');
const User              = require('../models/User');

/* ────────────────────────────────────────────────────────── */
/*  PROFILE                                                   */
/* ────────────────────────────────────────────────────────── */

async function getCounsellorProfile(userId) {
  const profile = await CounsellorProfile.findOne({ userId })
    .populate('assignedStudents', 'name email institution createdAt');

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

/* ────────────────────────────────────────────────────────── */
/*  STUDENT DASHBOARD VIEW                                    */
/* ────────────────────────────────────────────────────────── */

async function getAssignedStudentDashboard(counsellorUserId, studentUserId) {
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const isAssigned = profile.assignedStudents.some(
    (id) => id.toString() === studentUserId
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

  // Attach session history for this pair
  const sessionHistory = await Session.find({
    counsellorId: counsellorUserId,
    studentId:    studentUserId
  })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .select('scheduledAt status durationMinutes type notes');

  return { ...dashboard.toObject(), sessionHistory };
}

/* ────────────────────────────────────────────────────────── */
/*  SESSIONS                                                  */
/* ────────────────────────────────────────────────────────── */

async function getSessions(counsellorUserId, { limit, upcoming, studentId } = {}) {
  const query = { counsellorId: counsellorUserId };
  if (upcoming)  query.scheduledAt = { $gte: new Date() };
  if (studentId) query.studentId   = studentId;

  let q = Session.find(query)
    .sort({ scheduledAt: upcoming ? 1 : -1 })
    .populate('studentId', 'name email');

  if (limit) q = q.limit(Number(limit));

  const sessions = await q;

  // Flatten student name for frontend convenience
  return sessions.map(s => ({
    ...s.toObject(),
    studentName: s.studentId?.name || '—'
  }));
}

async function createSession(counsellorUserId, data) {
  const { studentId, scheduledAt, durationMinutes, type, notes } = data;

  // Ensure student is assigned to this counsellor
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const isAssigned = profile.assignedStudents.some(
    (id) => id.toString() === studentId
  );
  if (!isAssigned) {
    const err = new Error('Cannot schedule a session with an unassigned student');
    err.statusCode = 403;
    throw err;
  }

  // Fetch counsellor user to get institution
  const counsellorUser = await User.findById(counsellorUserId).select('institution');

  const session = await Session.create({
    counsellorId:    counsellorUserId,
    studentId,
    institution:     counsellorUser?.institution || '',
    scheduledAt:     new Date(scheduledAt),
    durationMinutes: durationMinutes || 50,
    type:            type || 'video',
    notes:           notes || '',
    status:          'scheduled'
  });

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
  return session;
}

/* ────────────────────────────────────────────────────────── */
/*  NOTES  (private — counsellor eyes only)                   */
/* ────────────────────────────────────────────────────────── */

async function getNotes(counsellorUserId, studentId) {
  // Verify assignment first
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  const isAssigned = profile?.assignedStudents.some(
    id => id.toString() === studentId
  );
  if (!isAssigned) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return CounsellorNote.find({ counsellorId: counsellorUserId, studentId })
    .sort({ updatedAt: -1 });
}

async function createNote(counsellorUserId, { studentId, title, content }) {
  // Verify assignment
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });
  const isAssigned = profile?.assignedStudents.some(
    id => id.toString() === studentId
  );
  if (!isAssigned) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  return CounsellorNote.create({
    counsellorId: counsellorUserId,
    studentId,
    title:   title   || '',
    content: content || ''
  });
}

async function updateNote(counsellorUserId, noteId, { title, content }) {
  const note = await CounsellorNote.findOne({ _id: noteId, counsellorId: counsellorUserId });
  if (!note) {
    const err = new Error('Note not found');
    err.statusCode = 404;
    throw err;
  }
  if (title   !== undefined) note.title   = title;
  if (content !== undefined) note.content = content;
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

/* ────────────────────────────────────────────────────────── */
/*  ANALYTICS  (institution-scoped, admin-linkable)           */
/* ────────────────────────────────────────────────────────── */

async function getAnalytics(counsellorUserId) {
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId })
    .populate('assignedStudents', '_id');

  if (!profile) {
    const err = new Error('Counsellor profile not found');
    err.statusCode = 404;
    throw err;
  }

  const studentIds = profile.assignedStudents.map(s => s._id);
  const totalStudents = studentIds.length;

  // Fetch all dashboards for assigned students
  const dashboards = await StudentDashboard.find({ userId: { $in: studentIds } });

  // Mood distribution
  let goodCount = 0, fairCount = 0, lowCount = 0;
  let moodTotal = 0, moodCount = 0;
  const atRiskList = [];

  for (const d of dashboards) {
    const score = d.mentalStats?.moodScore;
    if (score != null) {
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
          flagReason:  'Low mood score'
        });
      }
    }
  }

  const avgMoodScore = moodCount > 0 ? moodTotal / moodCount : null;

  // Session stats
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allSessions, monthlySessions] = await Promise.all([
    Session.find({ counsellorId: counsellorUserId }),
    Session.find({ counsellorId: counsellorUserId, scheduledAt: { $gte: monthStart } })
  ]);

  const completedSessions = allSessions.filter(s => s.status === 'completed').length;
  const completionRate    = allSessions.length
    ? Math.round((completedSessions / allSessions.length) * 100)
    : 0;

  // Session type breakdown
  const sessionTypeBreakdown = {};
  for (const s of allSessions) {
    sessionTypeBreakdown[s.type || 'video'] = (sessionTypeBreakdown[s.type || 'video'] || 0) + 1;
  }

  // Weekly volume — last 8 weeks
  const weeklySessionVolume = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const count = allSessions.filter(s => {
      const d = new Date(s.scheduledAt);
      return d >= weekStart && d < weekEnd;
    }).length;

    weeklySessionVolume.push({
      label: `W${8 - i}`,
      value: count
    });
  }

  return {
    totalStudents,
    avgMoodScore,
    atRiskStudents:          atRiskList.length,
    atRiskList,
    completionRate,
    totalSessionsThisMonth:  monthlySessions.length,
    weeklySessionVolume,
    sessionTypeBreakdown,
    moodDistribution: { good: goodCount, fair: fairCount, low: lowCount }
  };
}

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
  getAnalytics
};