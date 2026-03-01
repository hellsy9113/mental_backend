const express = require("express");
const {
  addMood,
  getMoodStatistics,
} = require("../controller/mood.controller");

const {verifyToken} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken, addMood);
router.get("/stats", verifyToken, getMoodStatistics);

module.exports = router;
