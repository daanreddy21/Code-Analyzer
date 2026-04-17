const pool = require("../config/db");

// ✅ Save Code
exports.saveCode = async (req, res) => {
  const { title, language, code } = req.body;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `INSERT INTO saved_codes (user_id, title, language, code)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, title, language, code]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get User Codes

exports.getCodes = async (req, res) => {
  // ✅ ADD THIS GUARD
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM saved_codes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("🎯 getCodes error:", err.message, err.stack); // 👈 ADD LOG
    res.status(500).json({ error: "Internal server error" });    // 👈 DON'T leak raw err.message
  }
};

exports.updateCodeC = async (req, res) => {
  const { id } = req.params;
  console.log("DEBUG USER:", req.user);
  const { title, language, code } = req.body;
 const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let result;

    // ✅ AUTO-SAVE (only code)
    if (title === undefined && language === undefined) {
      result = await pool.query(
        `UPDATE saved_codes 
         SET code = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [code, id, userId]
      );
    } 
    // ✅ FULL UPDATE
    else {
      result = await pool.query(
        `UPDATE saved_codes 
         SET title = $1, language = $2, code = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [title, language, code, id, userId]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Code not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("🎯 updateCode error:", err.message, err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
};