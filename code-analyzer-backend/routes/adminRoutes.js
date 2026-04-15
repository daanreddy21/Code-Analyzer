const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin"); // ✅ plural "controllers"
const authenticateToken = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// 🔥 NEW FILTER API
router.get("/submissions", authenticateToken, adminOnly, adminController.getSubmissions);

// OLD (optional)
router.get("/pending", authenticateToken, adminOnly, adminController.getPendingSubmissions);

router.get("/submission/:id", authenticateToken, adminOnly, adminController.getSubmissionById);

router.put("/approve/:id", authenticateToken, adminOnly, adminController.approveSubmission);

router.put("/reject/:id", authenticateToken, adminOnly, adminController.rejectSubmission);

router.put("/bookmark/:id", adminController.toggleBookmark);

router.get("/users-progress", adminController.getAllUsersProgress);

router.get("/user-stats/:userId", adminController.getUserStatsByAdmin);

router.get("/user-graph/:userId", adminController.getUserGraphByAdmin);

module.exports = router;