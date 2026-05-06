const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const rewardController = require("../controller/rewardController");

//  GET USER REWARDS
router.get("/", authenticateToken, rewardController.getUserRewards);

module.exports = router;
