const express = require("express");
const router = express.Router();
const chat = require("../controller/chatController");
const auth = require("../middleware/authMiddleware");

router.post("/conversation", auth, chat.getOrCreateConversation);
router.get("/messages/:conversationId", auth, chat.getMessages);
router.post("/send", auth, chat.sendMessage);
router.patch("/read/:conversationId", auth, chat.markAsRead);
router.get("/unread", auth, chat.getUnreadCount);
router.get("/chats", auth, chat.getUserChats);
router.get("/users", auth, chat.getAllUsersForChat);

module.exports = router;