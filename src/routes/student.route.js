
// const express = require("express");
// const { studentDashBoard } = require("../controller/student.controller");
// const { verifyToken } = require("../middleware/auth.middleware");



// const router = express.Router();

// router.get("/studentDashboard", verifyToken,studentDashBoard);


// module.exports = router;

const express = require('express');
const { studentDashBoard, updateDashboard } = require('../controller/student.controller');
const { verifyToken, isStudent } = require('../middleware/auth.middleware');

const router = express.Router();

// Only students can access their own dashboard
router.get('/student', verifyToken, isStudent, studentDashBoard);
router.patch('/student', verifyToken, isStudent, updateDashboard);

module.exports = router;
