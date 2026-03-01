// src/controllers/homepage.controller.js

const { getStudentDashboard } = require("../services/student.services");

async function studentDashBoard(req, res) {
  try {
     if(!req.user || !req.user.id)
     {
      return res.status(401).json({
        message: "Unauthorized access"
      });
    }

    const data = await getStudentDashboard(req.user.id);

    res.status(200).json({
      success: true,
      data
    });
  } 

  catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error"
    });
}
}

module.exports = {
  studentDashBoard
};
