const pool = require("../config/db");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcrypt"); // ✅ added bcrypt

// --- MULTER FOR PROFILE IMAGES ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
});

// 🔹 Get Profile (no retry loop, no email_notifications)
exports.getProfile = async (req, res) => {
  try {
    console.log("getProfile: req.userId =", req.userId);

    if (!req.userId) {
      return res.status(401).json({ error: "No user ID (unauthenticated?)" });
    }

    const result = await pool.query(
      `SELECT
         first_name, last_name, bio, education, college, location, skills,
         linkedin, github, profile_image, notifications
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
};

// 🔹 Update Profile (unchanged)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    let profileImagePath = null;
    let profileData = {};

    if (req.file) {
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
      profileData = {
        first_name: req.body.first_name || "",
        last_name: req.body.last_name || "",
        bio: req.body.bio || "",
        education: req.body.education || "",
        college: req.body.college || "",
        location: req.body.location || "",
        linkedin: req.body.linkedin || "",
        github: req.body.github || "",
        skills: req.body.skills || "",
        profile_image: profileImagePath,
      };
    } else {
      profileData = req.body;
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(profileData).forEach((key) => {
      if (profileData[key] !== undefined && profileData[key] !== null) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(profileData[key]);
        paramIndex++;
      }
    });

    values.push(userId);

    if (fields.length === 0) {
      return res.status(400).json({ error: "No data to update" });
    }

    const query = `
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex} 
      RETURNING id, first_name, last_name, profile_image
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    if (req.file && req.user?.oldImagePath && req.user.oldImagePath !== profileImagePath) {
      try {
        fs.unlinkSync(path.join(__dirname, "..", req.user.oldImagePath));
      } catch (e) {
        console.log("Old image cleanup failed (ok if already deleted)");
      }
    }

    res.json({
      message: "✅ Profile updated successfully!",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("Profile UPDATE error:", err);
    res.status(500).json({ error: "Update failed: " + err.message });
  }
};

// 🔥 NEW: Update Settings (PATCH /user/settings)
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const { notifications } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "User ID required" });
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (notifications !== undefined) {
      fields.push(`notifications = $${paramIndex}`);
      values.push(notifications);
      paramIndex++;
    }

    values.push(userId);

    if (fields.length === 0) {
      return res.status(400).json({ error: "No settings to update" });
    }

    const query = `
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex} 
      RETURNING notifications
    `;

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "✅ Settings updated!",
      settings: result.rows[0],
    });
  } catch (err) {
    console.error("Settings UPDATE error:", err);
    res.status(500).json({ error: "Settings update failed" });
  }
};

// 🔥 NEW: Password Reset Token (POST /user/password/reset)
exports.resetPassword = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [token, expires, userId]
    );

    console.log(`🔐 Reset token for user ${userId}: ${token} (expires: ${expires})`);

    res.json({
      message: "✅ Ready to reset password!",
      expires: expires.toISOString(),
    });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ error: "Failed to generate reset token" });
  }
};

// 🔥 NEW: Complete Password Reset (POST /user/password/complete-reset) – FIXED
exports.completePasswordReset = async (req, res) => {
  try {
    const userId = req.userId;
    const { newPassword } = req.body;

    if (!userId || !newPassword) {
      return res.status(400).json({ error: "User ID and new password required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be 6+ characters" });
    }

    // ✅ CORRECT: hash the new password with bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hashedPassword, userId]
    );

    res.json({ message: "✅ Password changed successfully!" });
  } catch (err) {
    console.error("Complete reset error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
};

// Export multer
exports.upload = upload;