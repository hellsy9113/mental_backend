const Music = require("../models/Music");

// Reusable active filter — includes docs where active is true OR field doesn't exist (backward compat)
const ACTIVE_FILTER = {
  $or: [
    { active: true },
    { active: { $exists: false } }
  ]
};

const getAllSongs = async () => {
  return await Music.find(ACTIVE_FILTER);
};

// ✅ Fix #5: was using strict { active: true }, now consistent with getAllSongs via ACTIVE_FILTER
const getSongsByCategory = async (category) => {
  return await Music.find({ category, ...ACTIVE_FILTER });
};

const searchSongs = async (query) => {
  return await Music.find({
    $text: { $search: query },
    ...ACTIVE_FILTER
  });
};

const getRandomSong = async () => {
  const song = await Music.aggregate([
    { $match: ACTIVE_FILTER },
    { $sample: { size: 1 } }
  ]);

  if (!song.length) {
    throw { statusCode: 404, message: "No songs available" };
  }

  return song[0];
};

// ✅ Fix #4: null check moved to controller (fetchSongById), service stays clean
const getSongById = async (id) => {
  return await Music.findById(id);
};

module.exports = {
  getAllSongs,
  getSongsByCategory,
  searchSongs,
  getRandomSong,
  getSongById
};