
const express = require("express");
const { studentDashBoard } = require("../controller/student.controller");
const { verifyToken } = require("../middleware/auth.middleware");



const router = express.Router();

router.get("/studentDashboard", verifyToken,studentDashBoard);


module.exports = router;
