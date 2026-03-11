const express = require("express");
const { chatWithAariv } = require("../controller/aarivController.js");

const router = express.Router();

router.post("/chat", chatWithAariv);

module.exports = router;