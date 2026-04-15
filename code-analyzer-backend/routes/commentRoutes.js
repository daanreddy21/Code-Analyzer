const express = require("express");
const router = express.Router();
const commentController = require("../controller/commentController");
const auth = require("../middleware/authMiddleware");

router.post("/", auth, commentController.addComment);
router.get("/:submissionId", auth, commentController.getComments);
router.get("/count/:submissionId", auth, commentController.getCommentCount);

module.exports = router;