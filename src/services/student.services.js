


const studentProfile = require("../models/StudentDashboard");

async function getStudentDashboard(userId) {
  // business logic only
  const dashboard = await studentProfile.findOne({ userId });

  if (!dashboard) {
    const error = new Error("Dashboard not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    appName: "Mental Health App",
    welcomeMessage: "Welcome to your personalized dashboard",
    serverTime: new Date().toISOString(),
    dashboard
  };
}

module.exports = {
  getStudentDashboard
};
