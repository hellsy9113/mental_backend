

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
    console.error('[mood] addMood error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode < 500 ? error.message : 'An internal error occurred.',
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
    console.error('[mood] getMoodStatistics error:', error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: statusCode < 500 ? error.message : 'An internal error occurred.',
    });
  }
};

module.exports = {
  addMood,
  getMoodStatistics,
};

// GET /api/mood/weekly-breakdown?tz=330
// tz = client's timezone offset in minutes (from JS: -new Date().getTimezoneOffset())
const getWeeklyBreakdown = async (req, res) => {
  try {
    const tzOffsetMinutes = parseInt(req.query.tz, 10) || 0;
    const breakdown = await moodService.getWeeklyBreakdown(req.user.id, tzOffsetMinutes);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    console.error('[mood] getWeeklyBreakdown error:', error);
    res.status(500).json({ success: false, message: 'An internal error occurred.' });
  }
};

// Re-export all three
Object.assign(module.exports, { getWeeklyBreakdown });