
const pool = require("../config/db");

exports.updateUserSettings = async (req, res) => {
  try {
    const userId = req.userId; // assumed from your JWT middleware
    const { notifications, email_notifications } = req.body;

    await pool.query(
      `UPDATE users 
       SET 
         notifications = COALESCE($1, notifications),
         email_notifications = COALESCE($2, email_notifications)
       WHERE id = $3`,
      [notifications, email_notifications, userId]
    );

    res.json({ message: "Settings updated." });
  } catch (err) {
    console.error("updateUserSettings error:", err);
    res.status(500).json({ error: err.message });
  }
};