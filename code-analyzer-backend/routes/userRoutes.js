const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require('multer'); // For profile images


// 🔹 Profile routes
router.get("/profile", authMiddleware, userController.getProfile);
router.put("/profile", authMiddleware, userController.upload.single('profile_image'), userController.updateProfile);

router.patch('/settings', authMiddleware, userController.updateSettings);
router.post('/password/reset', authMiddleware, userController.resetPassword);
router.post('/password/complete-reset', authMiddleware,userController.completePasswordReset);

module.exports = router;