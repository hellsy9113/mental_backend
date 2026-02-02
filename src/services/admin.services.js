// src/services/homepage.service.js

async function getAdminData() {
  return {
    appName: "Mental Health App",
    welcomeMessage: "Welcome to the Mental Health Platform (Admin profile)",
    serverTime: new Date().toISOString()
  };
}


module.exports = {
  getAdminData
};
