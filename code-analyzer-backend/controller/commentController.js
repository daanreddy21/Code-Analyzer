const pool = require("../config/db");

// ➕ Add comment
exports.addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const role = req.userRole;
    const { submissionId, comment } = req.body;

    // 🔥 ADD THIS HERE (TOP)
    if (!submissionId) {
      return res.status(400).json({ error: "submissionId is required ❌" });
    }

const result = await pool.query(
  `INSERT INTO submission_comments (submission_id, user_id, role, comment)
   VALUES ($1, $2, $3, $4) RETURNING *`,
  [submissionId, userId, role, comment]
);

// 🔥 GET FILE NAME
// 🔥 STEP 1: GET FILE + OWNER
const submission = await pool.query(
  "SELECT file_name, user_id FROM code_submissions WHERE id=$1",
  [submissionId]
);

const fileName = submission.rows[0]?.file_name || "Unknown File";
const ownerId = submission.rows[0]?.user_id;

// 🔥 STEP 2: CHECK ROLE
if (role === "admin") {

  // 👑 ADMIN → notify USER
  await pool.query(
    `INSERT INTO notifications 
     (admin_id, user_id, title, message, type, code_submission_id, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, false)`,
    [
      userId,             // admin_id
      ownerId,            // user_id
      "💬 Admin Comment",
      `Admin commented on "${fileName}"`,
      "comment",
      submissionId
    ]
  );

} else {

  // 👤 USER → notify ADMIN
  await pool.query(
    `INSERT INTO notifications 
     (user_id, title, message, type, code_submission_id, is_read)
     VALUES (NULL, $1, $2, $3, $4, false)`,
    [
      "💬 New Comment",
      `User commented on "${fileName}"`,
      "comment",
      submissionId
    ]
  );

}

// 🔥 REALTIME
if (global.io) {
  global.io.emit("newNotification", {
    type: "comment",
    message: "New comment added",
    submissionId
  });
}

// EXISTING SOCKET
if (global.io) {
  global.io.to(`submission_${submissionId}`).emit("new_comment", result.rows[0]);
}

res.json(result.rows[0]);

  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📥 Get comments
exports.getComments = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.query(
      `SELECT sc.*, u.name
       FROM submission_comments sc
       JOIN users u ON sc.user_id = u.id
       WHERE submission_id = $1
       ORDER BY created_at ASC`,
      [submissionId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 🔢 Count
exports.getCommentCount = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.query(
      `SELECT COUNT(*) FROM submission_comments WHERE submission_id=$1`,
      [submissionId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};