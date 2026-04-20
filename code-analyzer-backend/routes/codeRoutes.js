const express = require("express");
const router = express.Router();

const codeController = require("../controller/codeController");
const authMiddleware = require("../middleware/authMiddleware");
const { saveCode, getCodes, updateCodeC } = require("../controller/compilercontroller");
const liveAnalysisController = require("../controller/liveAnalysisController");
const aiAnalysisController = require("../controller/aiAnalysisController");

const rateLimit = require("express-rate-limit");
const compilerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many compiler requests, slow down!",
});

// 🔥 1. STATIC ROUTES FIRST
router.get("/stats", authMiddleware, codeController.getDashboardStats);
router.get("/recent", authMiddleware, codeController.getRecentScans);
router.get("/history", authMiddleware, codeController.getHistory);
router.get("/analysis-history", authMiddleware, codeController.getAnalysisHistory);
router.get("/recurring-issues", authMiddleware, codeController.getRecurringIssues);
router.get("/ai-suggestions", authMiddleware, codeController.getAISuggestions);
router.get("/codes", authMiddleware, getCodes);

// 🔥 2. UPLOAD & SAVE ROUTES
router.post("/paste", authMiddleware, codeController.pasteCode);
router.post("/upload", authMiddleware, codeController.uploadFile);
router.post("/run", compilerLimiter, (req, res) => { res.json({ message: "Compiler run endpoint" }); });
router.post("/save", authMiddleware, saveCode);  // Compiler save

// 🔥 3. SPECIFIC ROUTES (before :id)
router.get("/analyze/:id", authMiddleware, codeController.analyzeCode);
router.post("/live-analysis", authMiddleware, liveAnalysisController.liveAnalysis);
router.post("/ai-analysis", authMiddleware, aiAnalysisController.aiAnalyze);
router.get("/all-versions", authMiddleware, codeController.getAllVersionsGrouped);
router.get("/versions/:submission_id", authMiddleware, codeController.getCodeVersions);
router.post("/share/generate", authMiddleware, codeController.generateShareLink);
router.get("/share/:token", codeController.getSharedData);
router.get("/deleted", authMiddleware, codeController.getDeletedCodes);
router.post("/deleted/:original_id/undo", authMiddleware, codeController.undoDelete);

// 🔥 4. COMPILER UPDATE FIRST (CRITICAL!)
router.put("/:id", authMiddleware, updateCodeC);  // ✅ CodeRunnerPage autosave

// 🔥 5. CODE CONTROLLER ROUTES
router.put("/code/:id", authMiddleware, codeController.updateCode);  // Specific path
router.delete("/:id", authMiddleware, codeController.softDeleteCode);

// 🔥 6. GENERIC :id LAST
router.get("/:id", authMiddleware, codeController.getCodeById);

module.exports = router;