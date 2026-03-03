const express = require("express");
const {
  addMood,
  getMoodStatistics,
} = require("../controller/mood.controller");

const {verifyToken, isStudent} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", verifyToken,isStudent, addMood);
router.get("/stats", verifyToken,isStudent,getMoodStatistics);

module.exports = router;
