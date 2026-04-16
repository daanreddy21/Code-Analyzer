const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { explainCode, getUserCodes, getFailureExplanation } = require("../controller/explainController");

router.post("/", authenticateToken, explainCode);
router.get("/user-codes", authenticateToken, getUserCodes);
router.post("/failure-explanation", authenticateToken, getFailureExplanation);

module.exports = router;