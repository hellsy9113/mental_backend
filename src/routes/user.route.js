
const express = require("express");
const { studentDashBoard } = require("../controller/user.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/student", verifyToken,studentDashBoard);

module.exports = router;
