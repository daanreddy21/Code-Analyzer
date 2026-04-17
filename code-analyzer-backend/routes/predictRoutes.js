const express = require("express");
const router = express.Router();
const predictController = require("../controller/predictController");
const auth = require("../middleware/authMiddleware");

router.post("/", predictController.predictBehavior);

module.exports = router;