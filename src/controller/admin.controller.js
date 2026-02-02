const { getAdminData } = require("../services/admin.services");

async function adminDashBoard(req, res) {
  try {
    const data = await getAdminData();

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
  adminDashBoard
};
