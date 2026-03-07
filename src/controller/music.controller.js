const musicService = require("../services/music.services");

const fetchAllSongs = async (req, res) => {

  const songs = await musicService.getAllSongs();
  res.json(songs);

};

const fetchSongsByCategory = async (req, res) => {

  const songs = await musicService.getSongsByCategory(req.params.category);
  res.json(songs);

};

const searchMusic = async (req, res) => {

  const songs = await musicService.searchSongs(req.query.q);
  res.json(songs);

};

const fetchRandomSong = async (req, res) => {

  const song = await musicService.getRandomSong();
  res.json(song);

};

const fetchSongById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid song ID"
      });
    }

    const song = await musicService.getSongById(id);

    res.status(200).json(song);

  } catch (err) {
    next(err);
  }
};

module.exports = {
  fetchAllSongs,
  fetchSongsByCategory,
  searchMusic,
  fetchRandomSong,
  fetchSongById
};