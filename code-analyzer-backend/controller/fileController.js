const pool = require("../config/db");


const getUserId = (req) => {
  return req.userId;
};



exports.uploadFile = async (req, res) => {
  try {
    const file = req.file;
    const language = req.body.language;

    if (!file) return res.status(400).send("No file uploaded");

    const code = file.buffer.toString();
    const userId = getUserId(req);

    const result = await pool.query(
      `INSERT INTO code_submissions 
       (user_id, language, code, file_name, file_path) 
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, language, code, file.originalname, file.path || null]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
};


exports.getFiles = async (req, res) => {
  try {
    let { language = "", page = 1 } = req.query;

        page = parseInt(page);
        if (isNaN(page) || page < 1) page = 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const userId = getUserId(req);

    const result = await pool.query(
      `SELECT id, file_name, language
       FROM code_submissions
       WHERE user_id = $1
       AND language ILIKE $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, `%${language}%`, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching files");
  }
};


exports.getFileById = async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await pool.query(
      `SELECT * FROM code_submissions 
       WHERE id=$1 AND user_id=$2`,
      [req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching file");
  }
};


exports.updateFile = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = getUserId(req);

    const result = await pool.query(
      `UPDATE code_submissions
       SET code=$1, updated_at=NOW(), version=version+1
       WHERE id=$2 AND user_id=$3
       RETURNING *`,
      [code, req.params.id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).send("Access denied");
    }

    res.send("Updated successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed");
  }
};

const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });