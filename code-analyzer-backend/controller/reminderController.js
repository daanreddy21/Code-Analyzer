const pool = require("../config/db");

// 🔥 MAIN FUNCTION
exports.runSmartReminder = async () => {
  try {
    console.log("⏰ Running Smart Reminder Controller...");

    const result = await pool.query(`
      SELECT id, user_id, bug_count, file_name, updated_at
      FROM code_submissions
      WHERE bug_count > 0
      AND status = 'approved'
    `);

    for (let row of result.rows) {
      const { id, user_id, bug_count, file_name, updated_at } = row;

      const minutesPassed =
        (new Date() - new Date(updated_at)) / (1000 * 60);

      let level = null;
      let title = "";
      let message = "";

      // 🧠 LEVEL LOGIC
     if (minutesPassed >= 6) {
            level = "critical";
            title = "🔴 Critical: Bugs Not Fixed!";
            message = `You still have ${bug_count} bugs in "${file_name}". Immediate action required 🚨`;
            } 
            else if (minutesPassed >= 4) {
            level = "warning";
            title = "🟡 Warning: Bugs Pending";
            message = `Your code still has ${bug_count} bugs. Please fix them soon ⚠️`;
            } 
            else if (minutesPassed >= 2) {
            level = "reminder";
            title = "🟢 Reminder: Fix Your Bugs";
            message = `You have ${bug_count} bugs pending in "${file_name}". Improve your score 🚀`;
            }

      if (!level) continue;

      // 🚫 Avoid duplicate notifications
      const alreadySent = await pool.query(`
        SELECT 1 FROM notifications
        WHERE user_id = $1
        AND code_submission_id = $2
        AND type = $3
      `, [user_id, id, level]);

      if (alreadySent.rows.length > 0) continue;

      // 🔔 Insert notification
      await pool.query(`
        INSERT INTO notifications 
        (admin_id, user_id, title, message, type, code_submission_id, is_read)
        VALUES ($1,$2,$3,$4,$5,$6,false)
      `, [
        null,
        user_id,
        title,
        message,
        level,
        id
      ]);

      console.log(`🔔 ${level} reminder sent for submission ${id}`);
    }

  } catch (err) {
    console.error("Smart Reminder Error:", err);
  }
};

// 🔹 OPTIONAL: Manual Trigger API
exports.triggerReminder = async (req, res) => {
  try {
    await exports.runSmartReminder();
    res.json({ message: "✅ Smart reminders triggered successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};