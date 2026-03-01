// // src/controllers/homepage.controller.js

// const { getStudentDashboard } = require("../services/student.services");

// async function studentDashBoard(req, res) {
//   try {
//      if(!req.user || !req.user.id)
//      {
//       return res.status(401).json({
//         message: "Unauthorized access"
//       });
//     }

//     const data = await getStudentDashboard(req.user.id);

//     res.status(200).json({
//       success: true,
//       data
//     });
//   } 

//   catch (error) {
//     res.status(error.statusCode || 500).json({
//       message: error.message || "Internal server error"
//     });
// }
// }

// module.exports = {
//   studentDashBoard
// };


const { getStudentDashboard, updateStudentDashboard } = require('../services/student.services');

// GET /dashboard/student
async function studentDashBoard(req, res) {
  try {
    const dashboard = await getStudentDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// PATCH /dashboard/student
async function updateDashboard(req, res) {
  try {
    const dashboard = await updateStudentDashboard(req.user.id, req.body);
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = { studentDashBoard, updateDashboard };
