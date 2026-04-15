const pool = require("../config/db");

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    // ✅ STEP 1: CHECK USER SETTING
    const userSetting = await pool.query(
      "SELECT notifications FROM users WHERE id = $1",
      [userId]
    );

    if (!userSetting.rows[0].notifications) {
      return res.json([]); // 🚫 don't show anything
    }

    // ✅ STEP 2: FETCH NOTIFICATIONS
    const result = await pool.query(`
      SELECT n.*, u.first_name || ' ' || u.last_name as sender_name,
             cs.file_name as submission_name
      FROM notifications n
      LEFT JOIN users u ON n.admin_id = u.id
      LEFT JOIN code_submissions cs ON n.code_submission_id = cs.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    await pool.query(
      "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    // ✅ CHECK USER SETTING
    const userSetting = await pool.query(
      "SELECT notifications FROM users WHERE id = $1",
      [userId]
    );

    if (!userSetting.rows[0].notifications) {
      return res.json({ unread: 0 }); // 🚫 hide badge
    }

    const result = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId]
    );

    res.json({ unread: parseInt(result.rows[0].count) });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 👑 ADMIN ROUTES
exports.createAdminNotification = async (req, res) => {
  try {
    const adminId = req.userId;
    const { user_id, title, message, type, code_submission_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO notifications (admin_id, user_id, title, message, type, code_submission_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, false) RETURNING *`,
      [adminId, user_id, title, message, type || 'info', code_submission_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const adminId = req.userId;
    const { id } = req.params;
    const { status } = req.body;
    
    const project = await pool.query("SELECT user_id FROM projects WHERE id = $1", [id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    await pool.query("UPDATE projects SET status = $2 WHERE id = $1", [id, status]);
    const userId = project.rows[0].user_id;
    
    await pool.query(
      `INSERT INTO notifications (admin_id, user_id, title, message, type, code_submission_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [adminId, userId, `Project ${status}`, `Your project has been ${status}!`, 'project', null, false]
    );
    
    res.json({ message: `${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdminUnread = async (req, res) => {
  try {
    const adminId = req.userId;
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM notifications WHERE admin_id = $1 AND is_read = false",
      [adminId]
    );
    res.json({ unread: parseInt(result.rows[0].count) });
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