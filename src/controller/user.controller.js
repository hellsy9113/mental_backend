// src/controllers/homepage.controller.js

const { getStudentData } = require("../services/user.services");

async function studentDashBoard(req, res) {
  try {
    const data = await getStudentData();

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard"
    });
  }
}

module.exports = {
  studentDashBoard
};
