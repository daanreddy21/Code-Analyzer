const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notificationController'); // ✅ singular
const authMiddleware = require('../middleware/authMiddleware');

//  User routes
router.get('/', authMiddleware, notificationController.getUserNotifications);
router.put('/:id/read', authMiddleware, notificationController.markAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);
//  GET user unread count
router.get("/unread", authMiddleware, notificationController.getUserUnread);

// Admin routes  
router.post('/', authMiddleware, notificationController.createAdminNotification);
router.put('/:id/status', authMiddleware, notificationController.updateStatus);
router.get('/admin/unread', authMiddleware, notificationController.getAdminUnread);


module.exports = router;