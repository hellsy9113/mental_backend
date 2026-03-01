// const { getAdminData } = require("../services/admin.services");

// async function adminDashBoard(req, res) {
//   try {
//     const data = await getAdminData();

//     res.status(200).json({
//       success: true,
//       data
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to load dashboard"
//     });
//   }
// }

// module.exports = {
//   adminDashBoard
// };



const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  assignStudentToCounsellor,
  getPlatformStats
} = require('../services/admin.services');

// GET /admin/users?role=student|counsellor|admin
async function listUsers(req, res) {
  try {
    const { role } = req.query;
    const users = await getAllUsers(role);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// GET /admin/users/:id
async function getUser(req, res) {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// PATCH /admin/users/:id/role
async function changeUserRole(req, res) {
  try {
    const { role } = req.body;
    const user = await updateUserRole(req.params.id, role);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// DELETE /admin/users/:id
async function removeUser(req, res) {
  try {
    const result = await deleteUser(req.params.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// POST /admin/assign
// Body: { counsellorId, studentId }
async function assignStudent(req, res) {
  try {
    const { counsellorId, studentId } = req.body;
    const profile = await assignStudentToCounsellor(counsellorId, studentId);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// GET /admin/stats
async function platformStats(req, res) {
  try {
    const stats = await getPlatformStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load platform stats'
    });
  }
}

module.exports = {
  listUsers,
  getUser,
  changeUserRole,
  removeUser,
  assignStudent,
  platformStats
};
