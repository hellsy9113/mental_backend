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

module.exports = {
  createMoodEntry,
  getMoodStats,
};