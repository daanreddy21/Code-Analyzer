const pool = require("../config/db");


exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const role = req.userRole;

    let result;

if (role === "admin") {
  result = await pool.query(`
    SELECT n.*, 
           'System' as sender_name,
           cs.file_name as submission_name
    FROM notifications n
    LEFT JOIN code_submissions cs 
      ON n.code_submission_id = cs.id
    WHERE n.user_id IS NULL
       OR n.type IN ('submission','resubmission','comment')
    ORDER BY n.created_at DESC
    LIMIT 50
  `);
}else {
      // 👤 USER → get personal notifications
      const userSetting = await pool.query(
        "SELECT notifications FROM users WHERE id = $1",
        [userId]
      );

      if (!userSetting.rows[0].notifications) {
        return res.json([]);
      }

      result = await pool.query(`
        SELECT n.*, 
               u.first_name || ' ' || u.last_name as sender_name,
               cs.file_name as submission_name
        FROM notifications n
        LEFT JOIN users u ON n.admin_id = u.id
        LEFT JOIN code_submissions cs 
          ON n.code_submission_id = cs.id
        WHERE n.user_id = $1
        ORDER BY n.created_at DESC
        LIMIT 50
      `, [userId]);
    }

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1",
      [id]
    );

    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM notifications WHERE id = $1",
      [id]
    );

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.getUserUnread = async (req, res) => {
  const userId = req.userId;

  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );

  res.json({ unread: parseInt(result.rows[0].count) });
};



exports.getAdminUnread = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE user_id IS NULL AND is_read = false`
    );

    res.json({ unread: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.createAdminNotification = async (req, res) => {
  try {
    const adminId = req.userId;
    const { user_id, title, message, type, code_submission_id } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications 
       (admin_id, user_id, title, message, type, code_submission_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
      [adminId, user_id, title, message, type || 'info', code_submission_id || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.createSystemNotification = async ({
  title,
  message,
  type,
  submissionId
}) => {
  try {
    await pool.query(
      `INSERT INTO notifications 
       (user_id, title, message, type, code_submission_id, is_read)
       VALUES (NULL, $1, $2, $3, $4, false)`,
      [title, message, type, submissionId]
    );

    // REALTIME PUSH
    if (global.io) {
      global.io.emit("newNotification");
    }

  } catch (err) {
    console.error("Notification Error:", err);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    res.json({ message: "Status updated (placeholder)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};