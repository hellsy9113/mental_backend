// // src/services/homepage.service.js

// async function getAdminData() {
//   return {
//     appName: "Mental Health App",
//     welcomeMessage: "Welcome to the Mental Health Platform (Admin profile)",
//     serverTime: new Date().toISOString()
//   };
// }


// module.exports = {
//   getAdminData
// };



const User = require('../models/User');
const CounsellorProfile = require('../models/CounsellorProfile');
const StudentDashboard = require('../models/StudentDashboard');
const Session        = require('../models/Session');
const CounsellorNote = require('../models/CounsellorNote'); // notes count only, never content
 

// Get all users, optionally filtered by role
async function getAllUsers(roleFilter) {
  const query = roleFilter ? { role: roleFilter } : {};
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 });
  return users;
}

// Get a single user by ID
async function getUserById(userId) {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

// Change a user's role
// ── PATCH for admin.services.js ─────────────────────────────────────
// Replace the existing updateUserRole function with this one.
// Everything else in admin.services.js stays unchanged.
//
// Key change: $inc tokenVersion so any JWT issued with the old role
// is immediately invalidated — verifyToken's version check will reject it.

async function updateUserRole(userId, newRole) {
  const validRoles = ['student', 'counsellor', 'admin'];
  if (!validRoles.includes(newRole)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: { role: newRole },
      $inc: { tokenVersion: 1 }   // invalidates all currently issued JWTs for this user
    },
    { new: true }
  ).select('-password');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

// Delete a user and their associated profile
async function deleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Clean up role-specific profile
  if (user.role === 'student') {
    await StudentDashboard.deleteOne({ userId });
  } else if (user.role === 'counsellor') {
    await CounsellorProfile.deleteOne({ userId });
  }

  await User.findByIdAndDelete(userId);
  return { message: `User ${user.name} deleted successfully` };
}

// Assign a student to a counsellor
async function assignStudentToCounsellor(counsellorId, studentId) {
  const counsellor = await User.findOne({ _id: counsellorId, role: 'counsellor' });
  if (!counsellor) {
    const error = new Error('Counsellor not found');
    error.statusCode = 404;
    throw error;
  }

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) {
    const error = new Error('Student not found');
    error.statusCode = 404;
    throw error;
  }

  const profile = await CounsellorProfile.findOneAndUpdate(
    { userId: counsellorId },
    { $addToSet: { assignedStudents: studentId } }, // $addToSet prevents duplicates
    { new: true }
  ).populate('assignedStudents', 'name email');

  return profile;
}

// Platform-wide stats for admin overview
async function getPlatformStats() {
  const [totalStudents, totalCounsellors, totalAdmins] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'counsellor' }),
    User.countDocuments({ role: 'admin' })
  ]);

  return {
    totalUsers: totalStudents + totalCounsellors + totalAdmins,
    totalStudents,
    totalCounsellors,
    totalAdmins
  };
}

async function getInstitutionSessions(institution, { from, to, counsellorId } = {}) {
  const query = { institution };
  if (from || to) {
    query.scheduledAt = {};
    if (from) query.scheduledAt.$gte = new Date(from);
    if (to)   query.scheduledAt.$lte = new Date(to);
  }
  if (counsellorId) query.counsellorId = counsellorId;
 
  return Session.find(query)
    .populate('counsellorId', 'name email')
    .populate('studentId',   'name email')
    .sort({ scheduledAt: -1 });
}
 
// ─── Per-counsellor stats for an institution ──────────────
async function getCounsellorStatsForInstitution(institution) {
  const counsellors = await User.find({ role: 'counsellor', institution }).select('name email');
 
  const stats = await Promise.all(counsellors.map(async (c) => {
    const profile = await CounsellorProfile.findOne({ userId: c._id });
    const sessions = await Session.find({ counsellorId: c._id });
 
    const completed  = sessions.filter(s => s.status === 'completed').length;
    const completion = sessions.length
      ? Math.round((completed / sessions.length) * 100)
      : 0;
 
    return {
      counsellorId:    c._id,
      name:            c.name,
      email:           c.email,
      studentsAssigned: profile?.assignedStudents?.length ?? 0,
      totalSessions:   sessions.length,
      completedSessions: completed,
      completionRate:  completion,
      isActive:        profile?.isActive ?? false
    };
  }));
 
  return stats;
}
 
// ─── Institution-wide wellness summary (admin dashboard widget) ──
async function getInstitutionWellnessSummary(institution) {
  const students = await User.find({ role: 'student', institution }).select('_id');
  const studentIds = students.map(s => s._id);
 
  const dashboards = await StudentDashboard.find({ userId: { $in: studentIds } });
 
  let moodTotal = 0, moodCount = 0, atRisk = 0;
  for (const d of dashboards) {
    const score = d.mentalStats?.moodScore;
    if (score != null) {
      moodTotal += score;
      moodCount++;
      if (score < 4) atRisk++;
    }
  }
 
  const sessions = await Session.find({ institution });
  const thisMonth = new Date();
  thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
 
  const monthSessions = sessions.filter(s => new Date(s.scheduledAt) >= thisMonth);
 
  return {
    institution,
    totalStudents:     students.length,
    avgMoodScore:      moodCount > 0 ? (moodTotal / moodCount).toFixed(2) : null,
    atRiskStudents:    atRisk,
    totalSessions:     sessions.length,
    sessionsThisMonth: monthSessions.length
  };
}
 
module.exports = {

};
 

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  assignStudentToCounsellor,
  getPlatformStats,
  getInstitutionSessions,
  getCounsellorStatsForInstitution,
  getInstitutionWellnessSummary,

};
