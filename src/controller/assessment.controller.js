const Assessment = require('../models/Assesmet');

/**
 * GET /api/assessment/recent
 * Returns the most recent assessment for the logged-in student.
 */
const getRecentAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find the latest assessment for this user
    const assessment = await Assessment.findOne({ userId })
      .sort({ createdAt: -1 });

    if (!assessment) {
      return res.status(200).json({
        success: true,
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching recent assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent assessment'
    });
  }
};

module.exports = {
  getRecentAssessment
};
