const express = require("express");
const multer = require("multer");

const router = express.Router();
const upload = multer();

const fileController = require("../controller/fileController");
const authenticateToken = require("../middleware/authMiddleware");

/**
 * Routes
 */
router.post("/upload", authenticateToken, upload.single("file"), fileController.uploadFile);
router.get("/", authenticateToken, fileController.getFiles);
router.get("/:id", authenticateToken, fileController.getFileById);
router.put("/:id", authenticateToken, fileController.updateFile);


module.exports = router;