const moodService = require("../services/agreggate/mood.service");

const addMood = async (req, res) => {
  try {
    const { moodScore } = req.body;

    const mood = await moodService.createMoodEntry(
      req.user.id,
      moodScore
    );

    res.status(201).json({
      success: true,
      data: mood,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMoodStatistics = async (req, res) => {
  try {
    const stats = await moodService.getMoodStats(req.user.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addMood,
  getMoodStatistics,
};
