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
async function updateUserRole(userId, newRole) {
  const validRoles = ['student', 'counsellor', 'admin'];
  if (!validRoles.includes(newRole)) {
    const error = new Error('Invalid role');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { role: newRole },
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

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  assignStudentToCounsellor,
  getPlatformStats
};
