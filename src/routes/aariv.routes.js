const express = require("express");
const { chatWithAariv } = require("../controller/aariv.controller.js");

const router = express.Router();

router.post("/chat", chatWithAariv);

module.exports = router;