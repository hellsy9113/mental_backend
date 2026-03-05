// const moodService = require("../services/agreggate/mood.service");

// const addMood = async (req, res) => {
//   try {
//     const { moodScore } = req.body;

//     const mood = await moodService.createMoodEntry(
//       req.user.id,
//       moodScore
//     );

//     res.status(201).json({
//       success: true,
//       data: mood,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// const getMoodStatistics = async (req, res) => {
//   try {
//     const stats = await moodService.getMoodStats(req.user.id);

//     res.json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   addMood,
//   getMoodStatistics,
// };



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

// GET /api/mood/weekly-breakdown?tz=330
// tz = client's timezone offset in minutes (from JS: -new Date().getTimezoneOffset())
const getWeeklyBreakdown = async (req, res) => {
  try {
    const tzOffsetMinutes = parseInt(req.query.tz, 10) || 0;
    const breakdown = await moodService.getWeeklyBreakdown(req.user.id, tzOffsetMinutes);
    res.json({ success: true, data: breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Re-export all three
Object.assign(module.exports, { getWeeklyBreakdown });