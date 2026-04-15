const pool = require("../config/db");

exports.getSubmissions = async (req, res) => {
  try {
    const { status, bookmarked } = req.query;

    let query = `
      SELECT 
        cs.id, 
        cs.file_name, 
        cs.language, 
        cs.status, 
        cs.created_at,
        cs.is_bookmarked,   -- ⭐ ADDED
        u.name AS user_name
      FROM code_submissions cs
      JOIN users u ON cs.user_id = u.id
    `;

    const values = [];

    // ⭐ 1. BOOKMARK FILTER (priority)
    if (bookmarked === "true") {
      query += " WHERE cs.is_bookmarked = true";
    } 
    // 🔹 2. STATUS FILTER
    else if (status && status !== "all") {
      query += " WHERE cs.status = $1";
      values.push(status);
    }

    query += " ORDER BY cs.created_at DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingSubmissions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.id, cs.file_name, cs.language, cs.status, cs.created_at, u.name AS user_name
      FROM code_submissions cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.status = 'pending'
      ORDER BY cs.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT cs.file_name, cs.language, cs.code, cs.status, u.name
       FROM code_submissions cs
       JOIN users u ON cs.user_id = u.id
       WHERE cs.id = $1`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    
    if (!adminId) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const result = await pool.query(
      `UPDATE code_submissions 
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = NULL 
       WHERE id = $2 RETURNING user_id`,
      [adminId, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    const userId = result.rows[0].user_id;

    // ✅ FIXED: code_submission_id (matches your table)
    await pool.query(
      `INSERT INTO notifications (admin_id, user_id, title, message, type, code_submission_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, userId, '✅ Code Approved!', 'Your code submission has been approved!', 'success', id, false]
    );

    res.json({ message: "✅ Approved successfully + Notification sent!" });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.rejectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;
    let { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    reason = reason.trim();
    const check = await pool.query("SELECT status, user_id FROM code_submissions WHERE id = $1", [id]);
    
    if (check.rows.length === 0) {
      return res.status(404).json({ error: "Submission not found" });
    }

    if (check.rows[0].status === "approved") {
      return res.status(400).json({ error: "Already approved. Cannot reject." });
    }

    const userId = check.rows[0].user_id;

    await pool.query(
      `UPDATE code_submissions
       SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2
       WHERE id = $3`,
      [adminId, reason, id]
    );

    // ✅ FIXED: code_submission_id (matches your table)
    await pool.query(
      `INSERT INTO notifications (admin_id, user_id, title, message, type, code_submission_id, is_read) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [adminId, userId, '❌ Code Rejected', `Your submission was rejected: "${reason}". Please fix and resubmit.`, 'error', id, false]
    );

    res.json({ message: "❌ Rejected + Notification sent!" });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.sendProfileUpdateNotification = async (req, res) => {
  try {
    const adminId = req.userId;
    const { user_id, message } = req.body;

    await pool.query(
      `INSERT INTO notifications (admin_id, user_id, title, message, type, is_read) 
       VALUES ($1, $2, $3, $4, 'info', $5)`,
      [adminId, user_id, '📝 Profile Update', message || 'Your profile has been updated!', false]
    );

    res.json({ message: "Notification sent!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// 👑 Admin only - MISSING FUNCTIONS
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
    
    // For projects (if needed)
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

// 🔹 Toggle user notifications (Admin only)
exports.toggleUserNotifications = async (req, res) => {
  try {
    const adminId = req.userId;
    const { user_id } = req.params;
    
    const user = await pool.query("SELECT notifications_enabled FROM users WHERE id = $1", [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const newStatus = !user.rows[0].notifications_enabled;
    
    await pool.query(
      "UPDATE users SET notifications_enabled = $1 WHERE id = $2",
      [newStatus, user_id]
    );
    
    res.json({ 
      message: `Notifications ${newStatus ? 'ENABLED' : 'DISABLED'} for user`,
      enabled: newStatus 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE code_submissions 
       SET is_bookmarked = NOT is_bookmarked 
       WHERE id = $1 
       RETURNING is_bookmarked`,
      [id]
    );

    res.json({
      message: result.rows[0].is_bookmarked
        ? "⭐ Bookmarked"
        : "❌ Removed Bookmark",
      bookmarked: result.rows[0].is_bookmarked
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllUsersProgress = async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT id, name, email, points, level, badges, created_at
      FROM users
      WHERE role = 'user'
      ORDER BY created_at DESC
    `);

    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserStatsByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const totalScans = await pool.query(
      "SELECT COUNT(*) FROM code_submissions WHERE user_id=$1",
      [userId]
    );

    const avgScore = await pool.query(
      "SELECT AVG(analysis_score) FROM code_submissions WHERE user_id=$1",
      [userId]
    );

    const totalBugs = await pool.query(
      "SELECT SUM(bug_count) FROM code_submissions WHERE user_id=$1",
      [userId]
    );

    res.json({
      totalScans: parseInt(totalScans.rows[0].count),
      avgScore: Math.round(avgScore.rows[0].avg || 0),
      totalBugs: parseInt(totalBugs.rows[0].sum || 0)
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserGraphByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(`
      SELECT score, bug_count, created_at
      FROM code_analysis_history
      WHERE user_id = $1
      ORDER BY created_at ASC
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};