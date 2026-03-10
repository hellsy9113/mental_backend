const mongoose = require("mongoose"); // ✅ Fix #1: was missing, caused ReferenceError in fetchSongById
const musicService = require("../services/music.services");

// ✅ Fix #2: wrapped all handlers in try/catch so errors are forwarded to the global error handler

const fetchAllSongs = async (req, res, next) => {
  try {
    const songs = await musicService.getAllSongs();
    res.json(songs);
  } catch (err) {
    next(err);
  }
};

const fetchSongsByCategory = async (req, res, next) => {
  try {
    const songs = await musicService.getSongsByCategory(req.params.category);
    res.json(songs);
  } catch (err) {
    next(err);
  }
};

const searchMusic = async (req, res, next) => {
  try {
    const songs = await musicService.searchSongs(req.query.q);
    res.json(songs);
  } catch (err) {
    next(err);
  }
};

const fetchRandomSong = async (req, res, next) => {
  try {
    const song = await musicService.getRandomSong();
    res.json(song);
  } catch (err) {
    next(err);
  }
};

const fetchSongById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ✅ Fix #1 (continued): mongoose is now imported so this check works correctly
    // ✅ Fix #3 (test alignment): returns 400 as intended, not 500
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid song ID"
      });
    }

    const song = await musicService.getSongById(id);

    // ✅ Fix #4 (null check): service may return null if ID is valid but not found
    if (!song) {
      return res.status(404).json({ error: "Song not found" });
    }

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