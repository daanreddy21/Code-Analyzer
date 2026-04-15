const express = require("express");
const router = express.Router();

const { upload } = require("../controller/projectController");
const {
  submitProject,
  getMySubmissions,
  downloadProjectFile,
  deleteProject,
} = require("../controller/projectController");

const authenticateToken = require("../middleware/authMiddleware");

// ✅ These are correct
router.post("/submit", authenticateToken, upload, submitProject);
router.get("/my-submissions", authenticateToken, getMySubmissions);
router.get("/download/:id", authenticateToken, downloadProjectFile);
router.delete("/:id", authenticateToken, deleteProject);   // 👈 THIS IS IMPORTANT

module.exports = router;