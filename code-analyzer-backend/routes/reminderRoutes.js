const express = require("express");
const router = express.Router();

const reminderController = require("../controller/reminderController");
const authMiddleware = require("../middleware/authMiddleware");

// 🔹 Manual trigger (admin or testing)
router.post("/run", authMiddleware, reminderController.triggerReminder);

module.exports = router;