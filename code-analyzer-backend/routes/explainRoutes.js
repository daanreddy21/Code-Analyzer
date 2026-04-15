const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { explainCode, getUserCodes } = require("../controller/explainController");

router.post("/", authenticateToken, explainCode);
router.get("/user-codes", authenticateToken, getUserCodes);

module.exports = router;