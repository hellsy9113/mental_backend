


// const studentProfile = require("../models/StudentDashboard");

// async function getStudentDashboard(userId) {
//   // business logic only
//   const dashboard = await studentProfile.findOne({ userId });

//   if (!dashboard) {
//     const error = new Error("Dashboard not found");
//     error.statusCode = 404;
//     throw error;
//   }

//   return {
//     appName: "Mental Health App",
//     welcomeMessage: "Welcome to your personalized dashboard",
//     serverTime: new Date().toISOString(),
//     dashboard
//   };
// }

// module.exports = {
//   getStudentDashboard
// };


const StudentDashboard = require('../models/StudentDashboard');
const User = require('../models/User');

async function getStudentDashboard(userId) {
  const dashboard = await StudentDashboard.findOne({ userId });

  if (!dashboard) {
    const error = new Error('Student dashboard not found');
    error.statusCode = 404;
    throw error;
  }

  return dashboard;
}

// Update goals, journal entries, or mental stats
async function updateStudentDashboard(userId, updates) {
  const allowed = ['mentalStats', 'goals', 'journalEntries'];
  const sanitized = {};

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      sanitized[key] = updates[key];
    }
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

module.exports = { getStudentDashboard, updateStudentDashboard };
