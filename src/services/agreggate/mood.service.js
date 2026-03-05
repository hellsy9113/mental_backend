const mongoose=require("mongoose");
const Mood=require("../../models/Mood");

const createMoodEntry=async (userId,moodScore)=>{
 return await Mood.create({
    userId,
    moodScore,
    date:new Date()
 });
};
 
const getMoodStats = async (userId) => {
  const now = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setMonth(now.getMonth() - 1);

  const yearAgo = new Date();
  yearAgo.setFullYear(now.getFullYear() - 1);

  const stats = await Mood.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $facet: {
        weekly: [
          { $match: { date: { $gte: weekAgo } } },
          { $group: { _id: null, avg: { $avg: "$moodScore" } } },
        ],
        monthly: [
          { $match: { date: { $gte: monthAgo } } },
          { $group: { _id: null, avg: { $avg: "$moodScore" } } },
        ],
        yearly: [
          { $match: { date: { $gte: yearAgo } } },
          { $group: { _id: null, avg: { $avg: "$moodScore" } } },
        ],
      },
    },
  ]);

  return {
    weekly: stats[0]?.weekly[0]?.avg || 0,
    monthly: stats[0]?.monthly[0]?.avg || 0,
    yearly: stats[0]?.yearly[0]?.avg || 0,
  };
};

// Returns average mood score for each of the last 7 days.
// Days with no entries return score: 0.
// Response shape: [{ day: 'Mon', date: '2026-03-04', score: 7.5 }, ...]
const getWeeklyBreakdown = async (userId, tzOffsetMinutes = 0) => {
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Convert offset minutes to ±HH:MM string for MongoDB timezone param
  // e.g. 330 (IST) → "+05:30",  -300 (EST) → "-05:00"
  const sign    = tzOffsetMinutes >= 0 ? '+' : '-';
  const absMin  = Math.abs(tzOffsetMinutes);
  const hh      = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mm      = String(absMin % 60).padStart(2, '0');
  const tzStr   = `${sign}${hh}:${mm}`;

  // Build last 7 local calendar days (oldest first, today last)
  // We work in local time by shifting with the offset
  const localNow = new Date(Date.now() + tzOffsetMinutes * 60 * 1000);
  const todayStr = localNow.toISOString().slice(0, 10); // "2026-03-06" in local date

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(localNow);
    d.setUTCDate(d.getUTCDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const dayIndex = new Date(dateStr + 'T00:00:00Z').getUTCDay();
    // Adjust day label: dateStr is local date, but getUTCDay on midnight UTC gives correct day
    // since we built it from local-shifted time
    return { dateStr, label: DAY_LABELS[dayIndex] };
  });

  const sevenDaysAgo = new Date(days[0].dateStr + 'T00:00:00.000Z');
  // Shift back to real UTC start-of-day for the match
  const matchFrom = new Date(sevenDaysAgo.getTime() - tzOffsetMinutes * 60 * 1000);

  const results = await Mood.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: matchFrom },
      },
    },
    {
      $group: {
        _id: {
          // Group by LOCAL calendar date, not UTC
          $dateToString: { format: '%Y-%m-%d', date: '$date', timezone: tzStr },
        },
        avg: { $avg: '$moodScore' },
      },
    },
  ]);

  const scoreMap = {};
  results.forEach((r) => {
    scoreMap[r._id] = Math.round(r.avg * 10) / 10;
  });

  return days.map(({ dateStr, label }) => ({
    day:   label,
    date:  dateStr,
    score: scoreMap[dateStr] || 0,
  }));
};

module.exports = {
  createMoodEntry,
  getMoodStats,
  getWeeklyBreakdown,
};