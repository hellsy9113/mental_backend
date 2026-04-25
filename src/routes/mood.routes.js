// const express = require("express");
// const {
//   addMood,
//   getMoodStatistics,
// } = require("../controller/mood.controller");

// const {verifyToken, isStudent} = require("../middleware/auth.middleware");

// const router = express.Router();

// router.post("/", verifyToken,isStudent, addMood);
// router.get("/stats", verifyToken,isStudent,getMoodStatistics);

// module.exports = router;

const express = require("express");
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const {
  addMood,
  getMoodStatistics,
  getWeeklyBreakdown,
} = require("../controller/mood.controller");

const {verifyToken, isStudent} = require("../middleware/auth.middleware");

const router = express.Router();

const moodValidation = [
  body('moodScore').isInt({ min: 1, max: 10 }).withMessage('Mood score must be an integer between 1 and 10'),
  validate
];

router.post("/",                 verifyToken, isStudent, moodValidation, addMood);
router.get("/stats",             verifyToken, isStudent, getMoodStatistics);
router.get("/weekly-breakdown",  verifyToken, isStudent, getWeeklyBreakdown);

module.exports = router;