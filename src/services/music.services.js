const Music = require("../models/Music");

const getAllSongs = async () => {
  return await Music.find({
    $or: [
      { active: true },
      { active: { $exists: false } }
    ]
  });
};

const getSongsByCategory = async (category) => {

  return await Music.find({ category, active: true });

};

const searchSongs = async (query) => {

  return await Music.find({
    $text: { $search: query },
    active: true
  });

};

const getRandomSong = async () => {

  const song = await Music.aggregate([
  {
    $match: {
      $or: [
        { active: true },
        { active: { $exists: false } }
      ]
    }
  },
  { $sample: { size: 1 } }
])

    if (!song.length) {
    throw { statusCode: 404, message: "No songs available" };
  }


  return song[0];

};

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