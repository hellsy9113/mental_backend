const express = require("express");

const {
  fetchAllSongs,
  fetchSongsByCategory,
  searchMusic,
  fetchRandomSong,
  fetchSongById
} = require("../controller/music.controller");

const {verifyToken, isStudent} = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", verifyToken, isStudent, fetchAllSongs);

router.get("/random", verifyToken, isStudent, fetchRandomSong);

router.get("/search", verifyToken, isStudent,  searchMusic);

router.get("/category/:category",verifyToken, isStudent,  fetchSongsByCategory);

router.get("/:id",verifyToken, isStudent, fetchSongById);

module.exports = router;