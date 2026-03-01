const CounsellorProfile = require('../models/CounsellorProfile');
const StudentDashboard = require('../models/StudentDashboard');
const User = require('../models/User');

// Get counsellor's own profile
async function getCounsellorProfile(userId) {
  const profile = await CounsellorProfile.findOne({ userId })
    .populate('assignedStudents', 'name email createdAt');

  if (!profile) {
    const error = new Error('Counsellor profile not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

// Update bio, specialization, availability
async function updateCounsellorProfile(userId, updates) {
  const allowed = ['bio', 'specialization', 'availability'];
  const sanitized = {};

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key];
    }
  }

  const profile = await CounsellorProfile.findOneAndUpdate(
    { userId },
    { $set: sanitized },
    { new: true, runValidators: true }
  );

  if (!profile) {
    const error = new Error('Counsellor profile not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

// Get dashboard data of a specific assigned student
async function getAssignedStudentDashboard(counsellorUserId, studentUserId) {
  // Confirm the student is actually assigned to this counsellor
  const profile = await CounsellorProfile.findOne({ userId: counsellorUserId });

  if (!profile) {
    const error = new Error('Counsellor profile not found');
    error.statusCode = 404;
    throw error;
  }

  const isAssigned = profile.assignedStudents.some(
    (id) => id.toString() === studentUserId
  );

  if (!isAssigned) {
    const error = new Error('This student is not assigned to you');
    error.statusCode = 403;
    throw error;
  }

  const dashboard = await StudentDashboard.findOne({ userId: studentUserId });

  if (!dashboard) {
    const error = new Error('Student dashboard not found');
    error.statusCode = 404;
    throw error;
  }

  return dashboard;
}

module.exports = {
  getCounsellorProfile,
  updateCounsellorProfile,
  getAssignedStudentDashboard
};
