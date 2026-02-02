// src/services/homepage.service.js

async function getStudentData() {
  return {
    appName: "Mental Health App",
    welcomeMessage: "Welcome to the Mental Health Platform (User profile)",
    serverTime: new Date().toISOString()
  };
}


module.exports = {
  getStudentData
};
