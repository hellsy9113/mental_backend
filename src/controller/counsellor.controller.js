const {
  getCounsellorProfile,
  updateCounsellorProfile,
  getAssignedStudentDashboard
} = require('../services/counsellor.services');

// GET /counsellor/profile
async function getProfile(req, res) {
  try {
    const profile = await getCounsellorProfile(req.user.id);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// PATCH /counsellor/profile
async function updateProfile(req, res) {
  try {
    const profile = await updateCounsellorProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

// GET /counsellor/students/:studentId
async function viewStudentDashboard(req, res) {
  try {
    const dashboard = await getAssignedStudentDashboard(
      req.user.id,
      req.params.studentId
    );
    res.status(200).json({ success: true, data: dashboard });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = { getProfile, updateProfile, viewStudentDashboard };
