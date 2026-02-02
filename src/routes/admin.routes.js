const express = require("express");
const { adminDashBoard } = require("../controller/admin.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/admin", verifyToken,adminDashBoard);

module.exports = router;
