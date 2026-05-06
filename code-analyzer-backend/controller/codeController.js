const pool = require("../config/db");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { applyRewards } = require("./rewardController");


// --- MULTER SETUP ---
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });


// --- PASTE CODE (from textarea) ---
exports.pasteCode = async (req, res) => {
  try {
    const { language, code } = req.body;
    const user_id = req.userId;

    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    if (!code || code.trim().length < 10) {
      return res.status(400).json({ error: "Invalid or empty code" });
    }

    let fileName = "";
    let extension = "";

    if (language === "Java") extension = ".java";
    else if (language === "Python") extension = ".py";
    else if (language === "JavaScript") extension = ".js";
    else if (language === "C++") extension = ".cpp";
    else extension = ".txt";

    if (language === "Java") {
      const match = code.match(/class\s+(\w+)/);
      fileName = match ? match[1] + extension : "Main" + extension;
    } else {
      fileName = "code_" + Date.now() + extension;
    }

    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const existing = await pool.query(
      "SELECT * FROM code_submissions WHERE user_id=$1 AND file_name=$2",
      [user_id, fileName]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: "File already exists. Please rename or modify your code.",
      });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, code);

      const insertResult = await pool.query(
        `
        INSERT INTO code_submissions(user_id, language, code, file_name, file_path, status)
        VALUES($1, $2, $3, $4, $5, 'pending')
        RETURNING id
      `,
        [user_id, language, code, fileName, filePath]
      );

      const submissionId = insertResult.rows[0].id;

      // 🔔 ADMIN NOTIFICATION
      await pool.query(
        `INSERT INTO notifications 
        (user_id, title, message, type, code_submission_id, is_read)
        VALUES (NULL, $1, $2, $3, $4, false)`,
        [
          "📄 New Submission",
          `File "${fileName}" pasted for approval`,
          "submission",
          submissionId
        ]
      );

      // 🔥 SOCKET
      if (global.io) {
        global.io.emit("newNotification", {
          type: "submission",
          message: "User pasted code",
          submissionId
        });
      }

    res.json({
      message: "Code saved and file created successfully",
      fileName,
    });
  } catch (err) {
    console.error("pasteCode error:", err);
    res.status(500).json({ error: err.message });
  }
};


// --- UPLOAD FILE (from Analyzer.jsx) ---

exports.uploadFile = [
  upload.single("file"), // Multer expects field name: "file"
  async (req, res) => {
    try {
      const language = req.body.language;
      const user_id = req.userId;
      const clientCode = req.body.code; // edited code from textarea

      // --- Debug: see what the backend actually receives ---
      console.log("uploadFile req.body:", req.body);
      console.log("req.file:", req.file);

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const filePath = req.file.path;
      const fileName = req.file.originalname;

      const existing = await pool.query(
        "SELECT * FROM code_submissions WHERE user_id=$1 AND file_name=$2",
        [user_id, fileName]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          error: "File already exists. Please rename or modify your code.",
        });
      }

      let code = clientCode;
      if (!code) {
        code = fs.readFileSync(filePath, "utf8");
      }

      if (!code || code.trim().length < 10) {
        return res.status(400).json({ error: "Invalid file content" });
      }

      const insertResult = await pool.query(
        `
        INSERT INTO code_submissions(user_id, language, code, file_name, file_path, status)
        VALUES($1, $2, $3, $4, $5, 'pending')
        RETURNING id
      `,
        [user_id, language, code, fileName, filePath]
      );

      const submissionId = insertResult.rows[0].id;

      // 🔔 ADMIN NOTIFICATION
      await pool.query(
        `INSERT INTO notifications 
        (user_id, title, message, type, code_submission_id, is_read)
        VALUES (NULL, $1, $2, $3, $4, false)`,
        [
          "📁 New File Upload",
          `File "${fileName}" uploaded for approval`,
          "submission",
          submissionId
        ]
      );

      // 🔥 SOCKET
      if (global.io) {
        global.io.emit("newNotification", {
          type: "upload",
          message: "User uploaded file",
          submissionId
        });
      }

      res.json({
        message: "File uploaded successfully",
        fileName,
        filePath,
      });
    } catch (err) {
      console.error("uploadFile error:", err);
      res.status(500).json({ error: err.message });
    }
  },
];


// --- GET USER HISTORY ---
exports.getHistory = async (req, res) => {
  try {
    const user_id = req.userId;
    const result = await pool.query(
      `
      SELECT 
        id, language, file_name, created_at, status,
        rejection_reason,
        COALESCE(analysis_score, 0) as score,
        COALESCE(bug_count, 0) as bugs,
        is_pinned 
      FROM code_submissions
      WHERE user_id=$1
      ORDER BY created_at DESC
    `,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("getHistory error:", err);
    res.status(500).json({ error: err.message });
  }
};


// --- VIEW CODE BY ID ---
exports.getCodeById = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      "SELECT language, file_name, code FROM code_submissions WHERE id=$1",
      [id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("getCodeById error:", err);
    res.status(500).json({ error: err.message });
  }
};


// --- UPDATE CODE ---
exports.updateCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { language, code, file_name } = req.body;
    const user_id = req.userId;

    if (!code || code.trim().length < 10) {
      return res.status(400).json({ error: "Code content is too short or empty" });
    }

    
    const existing = await pool.query(
      "SELECT * FROM code_submissions WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Submission not found or unauthorized" });
    }

    const oldData = existing.rows[0];

    
    await pool.query(`
      INSERT INTO code_versions
      (submission_id, user_id, file_name, code, language, version)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      id,
      user_id,
      oldData.file_name,
      oldData.code,
      oldData.language,
      oldData.version || 1
    ]);

    

   
    const lines = code.split("\n").filter((l) => l.trim()).length;
    const functions = (code.match(
      /function\s+\w+|async\s+\w+\s*\(|def\s+\w+|public\s+\w+\s*\(|private\s+\w+\s*\(|protected\s+\w+\s*\(/gi
    ) || []).length;

    const metrics = {
      lines,
      functions,
      complexity: Math.min(10, functions + (code.match(/if\s*\(/g) || []).length),
    };

  
    const result = await pool.query(
      `
      UPDATE code_submissions SET 
        language = $1, 
        code = $2, 
        file_name = $3,
        status = 'pending',
        rejection_reason = NULL,
        metrics = $4,
        version = COALESCE(version,1) + 1,  -- 🔥 ONLY ADD THIS LINE
        updated_at = NOW()
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `,
      [language, code, file_name || null, JSON.stringify(metrics), id, user_id]
    );

      const fileNameFinal = file_name || oldData.file_name;

      await pool.query(
        `INSERT INTO notifications 
        (user_id, title, message, type, code_submission_id, is_read)
        VALUES (NULL, $1, $2, $3, $4, false)`,
        [
          "🔁 Code Resubmitted",
          `File "${fileNameFinal}" resubmitted for approval`,
          "resubmission",
          id
        ]
      );


if (global.io) {
  global.io.emit("newNotification", {
    type: "resubmission",
    message: "Code resubmitted",
    submissionId: id
  });
}

    res.json({ 
      message: "✅ Code updated + version saved successfully!",
      data: result.rows[0] 
    });

  } catch (err) {
    console.error("updateCode error:", err);
    res.status(500).json({ error: err.message });
  }
};




exports.softDeleteCode = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = parseInt(req.params.id);
    
    // 🔥 1. Get submission data (user_id is INTEGER)
    const submission = await client.query(`
      SELECT id, user_id, code, file_name, language, created_at, reward_points
      FROM code_submissions 
      WHERE id = $1
    `, [id]);
    
    if (submission.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Submission not found" });
    }
    
    const data = submission.rows[0];
    
    // 🔥 2. Delete ALL related records
    await client.query("DELETE FROM notifications WHERE code_submission_id = $1", [id]);
    await client.query("DELETE FROM rewards WHERE submission_id = $1", [id]);
    await client.query("DELETE FROM code_analysis_history WHERE submission_id = $1", [id]);
    await client.query("DELETE FROM code_versions WHERE submission_id = $1", [id]);
    await client.query("DELETE FROM share_links WHERE submission_id = $1", [id]);
    
    // 🔥 3. Move to deleted_codes (user_id INTEGER now)
    await client.query(`
      INSERT INTO deleted_codes (original_id, user_id, code, file_name, language, created_at, deleted_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      id, 
      data.user_id,           // INTEGER ✅
      data.code, 
      data.file_name, 
      data.language, 
      data.created_at,
      'User deleted'
    ]);
    
    // 🔥 4. Deduct points (if any)
    if (data.reward_points > 0) {
      await client.query(
        "UPDATE users SET points = GREATEST(points - $1, 0) WHERE id = $2", 
        [data.reward_points, data.user_id]
      );
    }
    
    // 🔥 5. Delete original
    await client.query("DELETE FROM code_submissions WHERE id = $1", [id]);
    
    await client.query('COMMIT');
    res.json({ message: "✅ Code moved to Deleted (Undo available)" });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("softDelete error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};


exports.getDeletedCodes = async (req, res) => {
  try {
    // Get user's deleted files (authMiddleware sets req.user.id)
    const result = await pool.query(`
      SELECT id, original_id, file_name, language, created_at, deleted_at, deleted_reason
      FROM deleted_codes 
      WHERE user_id = $1 
      ORDER BY deleted_at DESC
      LIMIT 100
    `, [req.user.id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error("getDeletedCodes error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.undoDelete = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const original_id = parseInt(req.params.original_id);
    
    // 1. Get deleted data
    const deleted = await client.query(`
      SELECT * FROM deleted_codes WHERE original_id = $1
    `, [original_id]);
    
    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: "Deleted file not found" });
    }
    
    const data = deleted.rows[0];
    
    // 2. Restore to code_submissions
    await client.query(`
      INSERT INTO code_submissions (
        id, user_id, code, file_name, language, created_at, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'restored')
    `, [
      data.original_id,
      data.user_id,
      data.code,
      data.file_name,
      data.language,
      data.created_at
    ]);
    
    // 3. Remove from deleted_codes
    await client.query("DELETE FROM deleted_codes WHERE original_id = $1", [original_id]);
    
    await client.query('COMMIT');
    res.json({ message: "✅ File restored!" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("undoDelete error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};




exports.analyzeCode = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      "SELECT code, language, status, user_id FROM code_submissions WHERE id=$1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Code submission not found." });
    }

    if (result.rows[0].status !== "approved") {
      return res.status(403).json({
        error: "Code not approved yet. Wait for admin approval.",
      });
    }

    const code = result.rows[0].code;
    const language = result.rows[0].language.toLowerCase();
    const userId = result.rows[0].user_id;

    let score = 100;
    let issues = [];

    const addIssue = (type, title, suggestion, penalty) => {
      issues.push({ type, title, suggestion, penalty });
      score -= penalty;
    };

    // Basic metrics
    const lines = code.split("\n").filter((line) => line.trim()).length;
    let metrics = {
      lines,
      functions: 0,
      complexity: 0,
    };

    // Function count (JS, Python, Java)
    const functionMatches =
      code.match(
        /function\s+\w+|async\s+\w+\s*\(|def\s+\w+|public\s+\w+\s*\(|private\s+\w+\s*\(|protected\s+\w+\s*\(/gi
      );
    metrics.functions = functionMatches ? functionMatches.length : 0;
    const ifCount = (code.match(/if\s*\(/g) || []).length;
    metrics.complexity = Math.min(10, metrics.functions + ifCount);

    console.log("🔍 Analyzing:", language, "Code preview:", code.substring(0, 100));

    // === JAVASCRIPT BUG / STYLE DETECTORS ===
    if (language.includes("javascript") || language.includes("js")) {
      console.log("✅ JS detectors running");

      // 1. eval / Function (code injection)
      if (/eval\s*\(|Function\s*\(/i.test(code)) {
        addIssue(
          "CRITICAL",
          "Code Injection Risk (eval)",
          "Use JSON.parse() instead of eval().",
          35
        );
      }

      // 2. XSS via innerHTML
      if (/\.innerHTML\s*=/.test(code) && !/textContent/i.test(code)) {
        addIssue(
          "HIGH",
          "XSS Vulnerability (innerHTML)",
          "Prefer .textContent or sanitization over .innerHTML.",
          25
        );
      }

      // 3. Loose equality (==) detection
      if (/\b==\b/.test(code)) {
        addIssue(
          "MEDIUM",
          "Loose Equality Usage",
          "Use === instead of == for strict comparison.",
          15
        );
      }

      // 4. Loose inequality (!=) detection
      if (/\b!=\b/.test(code)) {
        addIssue(
          "MEDIUM",
          "Loose Inequality Usage",
          "Use !== instead of != for strict comparison.",
          10
        );
      }

      // 5. Syntax error heuristic (unclosed quotes, braces, etc.)
      if (
        (code.match(/['"]\s*$/g) &&
          code.match(/['"]/g)?.length % 2 !== 0) ||
        code.match(/\{.*$/g)?.length > (code.match(/\}/g)?.length || 0)
      ) {
        addIssue(
          "HIGH",
          "Potential Syntax Error",
          "Check for unclosed quotes, braces, or missing semicolons.",
          20
        );
      }

      // 6. Missing semicolon at end of statement (simplified)
      if (
        /[^;]\s*$/g.test(code.trim()) &&
        /;/.test(code) === false &&
        lines <= 50
      ) {
        addIssue(
          "LOW",
          "Missing Semicolon",
          "Always end statements with a semicolon for safety.",
          5
        );
      }

      // 7. Global variable (var without let/const in simple cases)
      if (
        /var\s+\w+/.test(code) &&
        !/let\s+\w+|const\s+\w+/.test(code)
      ) {
        addIssue(
          "LOW",
          "Global Variable Declaration",
          "Prefer let/const over var for block‑scoped variables.",
          6
        );
      }
    }

    // === PYTHON ===
    if (language.includes("python") || language.includes("py")) {
      console.log("✅ Python detectors running");

      // 1. eval / exec
      if (/eval\s*\(|exec\s*\(/i.test(code)) {
        addIssue(
          "CRITICAL",
          "Arbitrary Code Execution",
          "Use ast.literal_eval() instead of eval/exec.",
          40
        );
      }

      // 2. print in production‑like code
      if (/print\s*\(/i.test(code)) {
        addIssue(
          "LOW",
          "Production Print Statements",
          "Use logging module instead of print for logs.",
          6
        );
      }
    }

    // === JAVA ===
    if (language.includes("java")) {
      console.log("✅ Java detectors running");

      // 1. Generic exception catching
      if (/catch\s*\(\s*(Exception|Throwable)/i.test(code)) {
        addIssue(
          "CRITICAL",
          "Generic Exception Catching",
          "Catch specific exceptions instead of Exception/Throwable.",
          30
        );
      }

      // 2. Debug prints
      if (/System\.out\.println/i.test(code)) {
        addIssue(
          "LOW",
          "Debug Prints Found",
          "Use SLF4J/other logging framework instead of System.out.println.",
          8
        );
      }
    }

    // === UNIVERSAL / SQL‑INJECTION ===
    if (/query.*["'].*\+|["'].*\+\s*query/i.test(code)) {
      addIssue(
        "CRITICAL",
        "SQL Injection Risk",
        "Use parameterized queries or prepared statements.",
        35
      );
    }

    if (metrics.lines > 300) {
      addIssue(
        "MEDIUM",
        "Large File Detected",
        "Split into smaller files/modules for better maintainability.",
        15
      );
    }

          // === CODE STYLE / FORMATTING ANALYSIS ===

      // Split into all lines (including empty ones)
      const allLines = code.split("\n");

      // Track indentation patterns
      let indentSizes = [];
      let hasTabs = false;
      let hasSpaces = false;

      allLines.forEach((line) => {
        if (!line.trim()) return; // skip empty lines

        const leading = line.match(/^\s*/)[0];

        // Detect tabs
        if (leading.includes("\t")) {
          hasTabs = true;
          indentSizes.push("tab");
        }

        // Detect spaces
        if (leading.includes(" ")) {
          hasSpaces = true;
          indentSizes.push(leading.length);
        }
      });

      // 🔴 1. Mixed Tabs & Spaces
      if (hasTabs && hasSpaces) {
        addIssue(
          "MEDIUM",
          "Mixed Tabs and Spaces",
          "Avoid mixing tabs and spaces. Use only one style consistently.",
          12
        );
      }

      // 🔴 2. Inconsistent Indentation
      const numericIndents = indentSizes.filter(i => typeof i === "number");

      if (numericIndents.length > 0) {
        const freq = {};

        numericIndents.forEach(i => {
          freq[i] = (freq[i] || 0) + 1;
        });

        // Find most common indentation
        const mostCommonIndent = Object.keys(freq).reduce((a, b) =>
          freq[a] > freq[b] ? a : b
        );

        // Check inconsistency
        const inconsistent = numericIndents.some(i => i != mostCommonIndent);

        if (inconsistent) {
          addIssue(
            "LOW",
            "Inconsistent Indentation",
            `Use consistent indentation (${mostCommonIndent} spaces detected as standard).`,
            8
          );
        }
      }

      // 🔴 3. Irregular Spacing (operators)
      const spacingIssues = allLines.some(line =>
        /\w=\w/.test(line) || /\w\s{2,}\w/.test(line)
      );

      if (spacingIssues) {
        addIssue(
          "LOW",
          "Inconsistent Spacing",
          "Maintain consistent spacing around operators and avoid multiple spaces.",
          5
        );
      }

      // 🔴 4. Trailing Spaces
      const trailingSpaces = allLines.some(line => /\s+$/.test(line));

      if (trailingSpaces) {
        addIssue(
          "LOW",
          "Trailing Spaces Detected",
          "Remove unnecessary spaces at end of lines.",
          4
        );
      }

      // 🔴 5. Too Many Empty Lines
      const emptyLines = allLines.filter(line => !line.trim()).length;

      if (emptyLines > allLines.length * 0.3) {
        addIssue(
          "LOW",
          "Too Many Empty Lines",
          "Reduce unnecessary blank lines for better readability.",
          4
        );
      }

    // Update DB
    await pool.query(
      "UPDATE code_submissions SET analysis_score = $1, bug_count = $2, metrics = $3 WHERE id = $4",
      [Math.max(0, Math.round(score)), issues.length, JSON.stringify(metrics), id]
    );

    // 📊 Insert history

      // 🔥 STEP 1: Get current version
      const versionRes = await pool.query(
        "SELECT COUNT(*) FROM code_analysis_history WHERE submission_id = $1",
        [id]
      );

      const version = parseInt(versionRes.rows[0].count) + 1;

      // 📊 STEP 2: Insert with version
     await pool.query(
        `INSERT INTO code_analysis_history
        (submission_id, user_id, version, score, bug_count, issues, suggestions, metrics, code)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          id,
          userId,
          version,
          Math.max(0, Math.round(score)),
          issues.length,
          JSON.stringify(issues),
          JSON.stringify(issues.map(i => i.suggestion)),
          JSON.stringify(metrics),
          code   // 🔥 ADD THIS
        ]
      );

    // Apply rewards
    const rewardData = await applyRewards(
      userId,
      id,
      Math.max(0, Math.round(score)),
      issues.length
    );


    let aiSuggestions = [];

    try {
      const aiResponse = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a code style analyzer. Give short suggestions about indentation, spacing, and formatting."
            },
            {
              role: "user",
              content: `Analyze this code and give formatting improvements only:\n\n${code}`
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const aiText = aiResponse.data.choices[0].message.content;

      aiSuggestions.push({
        type: "AI",
        title: "AI Code Suggestions",
        suggestion: aiText,
        penalty: 0
      });

    } catch (err) {
      console.log("OpenRouter AI Error:", err.message);
    }

    // Format issues for display
    const issuesDisplay = issues.map((issue) => {
      const prefix =
        {
          CRITICAL: "🔴",
          HIGH: "🟠",
          MEDIUM: "🟡",
          LOW: "🟢",
        }[issue.type] || "🟢";
      return `${prefix} ${issue.title}
💡 SUGGESTED FIX:
${issue.suggestion}`;
    });

    console.log(`✅ Found ${issues.length} issues:`, issues.map((i) => i.title));

    res.json({
      code,
      language: result.rows[0].language,
      score: Math.max(0, Math.round(score)),
      issues: [...issues, ...aiSuggestions],
      issuesDisplay,
      metrics,
      rewards: rewardData,
    });
  } catch (err) {
    console.error("analyzeCode error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.togglePin = async (req, res) => {
  try {
    const id = req.params.id;
    const user_id = req.userId;

    const result = await pool.query(
      `
      UPDATE code_submissions
      SET is_pinned = NOT is_pinned
      WHERE id = $1 AND user_id = $2
      RETURNING is_pinned
      `,
      [id, user_id]
    );

    res.json({
      message: "Pin toggled",
      isPinned: result.rows[0].is_pinned
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};


exports.getFileAnalysisTimeline = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const userId = req.userId;

    const result = await pool.query(
      `SELECT 
        version,
        score,
        bug_count,
        issues,
        metrics,
        code,
        created_at
      FROM code_analysis_history
      WHERE submission_id = $1 AND user_id = $2
      ORDER BY version DESC`,
      [submissionId, userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Timeline error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAnalysisHistory = async (req, res) => {
  try {
    console.log("🔍 userId:", req.userId);  // DEBUG
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "No user ID in token" });
    }

    const result = await pool.query(
      `SELECT score, bug_count, created_at
       FROM code_analysis_history
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    console.log("✅ Found", result.rows.length, "records");  // DEBUG
    res.json(result.rows);
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getRecurringIssues = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await pool.query(
      `SELECT issues FROM code_analysis_history WHERE user_id = $1`,
      [userId]
    );

    const issueCount = {};

    result.rows.forEach(row => {
      const issues = row.issues || [];

      issues.forEach(issue => {
        const title = issue.title;
        issueCount[title] = (issueCount[title] || 0) + 1;
      });
    });

    const sortedIssues = Object.entries(issueCount)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json(sortedIssues);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch recurring issues" });
  }
};


exports.getAISuggestions = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all issues history
    const result = await pool.query(
      `SELECT issues FROM code_analysis_history WHERE user_id = $1`,
      [userId]
    );

    const issueCount = {};

    // Count recurring issues
    result.rows.forEach(row => {
      const issues = row.issues || [];

      issues.forEach(issue => {
        const title = issue.title;
        issueCount[title] = (issueCount[title] || 0) + 1;
      });
    });

    // Convert to array
    const sortedIssues = Object.entries(issueCount)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count);

    // 🎯 Generate AI Suggestions
    const suggestions = [];

    sortedIssues.forEach(issue => {
      const title = issue.title.toLowerCase();

      // 🔴 CRITICAL SECURITY
      if (title.includes("eval")) {
        suggestions.push({
          message: "🚨 Avoid using eval() — it can lead to code injection attacks.",
          type: "CRITICAL"
        });
      }

      if (title.includes("innerhtml")) {
        suggestions.push({
          message: "⚠️ Avoid innerHTML — use textContent to prevent XSS attacks.",
          type: "HIGH"
        });
      }

      if (title.includes("sql injection")) {
        suggestions.push({
          message: "🚨 Use parameterized queries to prevent SQL injection.",
          type: "CRITICAL"
        });
      }

      // 🟡 CODE QUALITY
      if (title.includes("loose equality")) {
        suggestions.push({
          message: "💡 Use === instead of == for safer comparisons.",
          type: "MEDIUM"
        });
      }

      if (title.includes("var")) {
        suggestions.push({
          message: "💡 Use let/const instead of var for better scope handling.",
          type: "LOW"
        });
      }

      // 🟢 CLEAN CODE
      if (title.includes("large file")) {
        suggestions.push({
          message: "📂 Break large files into smaller modules for maintainability.",
          type: "MEDIUM"
        });
      }

      if (title.includes("print") || title.includes("console")) {
        suggestions.push({
          message: "🧹 Remove debug logs in production code.",
          type: "LOW"
        });
      }
    });

    // Remove duplicates
    const uniqueSuggestions = [
      ...new Map(suggestions.map(s => [s.message, s])).values()
    ];

    res.json(uniqueSuggestions.slice(0, 5)); // Top 5 suggestions

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate AI suggestions" });
  }
};


exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    const totalScansResult = await pool.query(
      "SELECT COUNT(*) as total FROM code_submissions WHERE user_id = $1",
      [userId]
    );
    const avgScoreResult = await pool.query(
      "SELECT AVG(analysis_score) as avg FROM code_submissions WHERE user_id = $1 AND analysis_score > 0",
      [userId]
    );
    const totalBugsResult = await pool.query(
      "SELECT SUM(bug_count) as total FROM code_submissions WHERE user_id = $1",
      [userId]
    );

    const totalScans = parseInt(totalScansResult.rows[0].total);
    const avgScore = avgScoreResult.rows[0].avg
      ? Math.round(parseFloat(avgScoreResult.rows[0].avg))
      : 0;
    const totalBugs = parseInt(totalBugsResult.rows[0].total) || 0;

    res.json({ totalScans, avgScore, totalBugs });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: err.message });
  }
};

//  FIXED RECENT SCANS - Matches History exactly
exports.getRecentScans = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await pool.query(`
      SELECT id, language, file_name, created_at, status, 
             COALESCE(analysis_score, 0) as score, 
             COALESCE(bug_count, 0) as bugs
      FROM code_submissions 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);
    
    const scans = result.rows.map(scan => ({
      id: scan.id,
      language: scan.language,
      file_name: scan.file_name || "Pasted Code",
      created_at: scan.created_at,
      status: scan.status,
      score: parseInt(scan.score) || 0,
      bugs: parseInt(scan.bugs) || 0
    }));
    
    res.json(scans);
  } catch (err) {
    console.error("Recent scans error:", err);
    res.status(500).json({ error: err.message });
  }
};


//  Get all versions in compare code
exports.getCodeVersions = async (req, res) => {
  try {
    const submission_id = parseInt(req.params.submission_id);  // 🔥 Convert to int
    if (isNaN(submission_id)) {
      return res.status(400).json({ error: "Invalid submission ID" });
    }

    const result = await pool.query(`
      SELECT id, version, code, file_name, created_at
      FROM code_versions
      WHERE submission_id = $1
      ORDER BY version DESC
    `, [submission_id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
};

//  Get all versions in compare code (grouped)
exports.getAllVersionsGrouped = async (req, res) => {
  try {
    const user_id = req.userId; // 🔥 VERY IMPORTANT

    const result = await pool.query(`
      SELECT submission_id, file_name, version, code, created_at
      FROM code_versions
      WHERE user_id = $1
      ORDER BY submission_id, version DESC
    `, [user_id]);

    const grouped = {};

    result.rows.forEach(row => {
      if (!grouped[row.submission_id]) {
        grouped[row.submission_id] = {
          submission_id: row.submission_id,
          file_name: row.file_name,
          versions: []
        };
      }

      grouped[row.submission_id].versions.push({
        version: row.version,
        code: row.code,
        created_at: row.created_at,
        file_name: row.file_name
      });
    });

    res.json(Object.values(grouped));

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
};

//  SHARE LINK FEATURE
const crypto = require("crypto");

//  Generate Share Link
exports.generateShareLink = async (req, res) => {
  try {
    const { submission_id, type } = req.body;

    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(`
      INSERT INTO share_links (token, submission_id, type, expires_at)
      VALUES ($1, $2, $3, $4)
    `, [token, submission_id, type, expiresAt]);

    res.json({
      link: `http://localhost:5173/share/${token}`
    });

  } catch (err) {
    console.error("generateShareLink error:", err);
    res.status(500).json({ error: err.message });
  }
};


//  Access Shared Link
exports.getSharedData = async (req, res) => {
  try {
    const { token } = req.params;

    // 🔹 Get share link
    const linkResult = await pool.query(
      "SELECT * FROM share_links WHERE token = $1",
      [token]
    );

    if (linkResult.rows.length === 0) {
      return res.status(404).json({ error: "Invalid link" });
    }

    const link = linkResult.rows[0];

    // ⏳ Expiry check
    if (new Date() > link.expires_at) {
      return res.status(410).json({ error: "Link expired" });
    }

    // 🔹 Get code
    const codeResult = await pool.query(
      "SELECT * FROM code_submissions WHERE id = $1",
      [link.submission_id]
    );

    if (codeResult.rows.length === 0) {
      return res.status(404).json({ error: "Code not found" });
    }

    const codeData = codeResult.rows[0];
    const code = codeData.code || "";

    // ================= VIEW =================
    if (link.type === "view") {
      return res.json({
        type: "view",
        code,
        file_name: codeData.file_name
      });
    }

    // ================= ANALYZE =================
    if (link.type === "analyze") {
      let score = 100;
      const issues = [];

      try {
        // 🔹 SAFE ANALYSIS
        if (code.includes("eval(")) {
          issues.push({
            title: "Use of eval()",
            suggestion: "Avoid eval due to security risks",
            penalty: 20
          });
          score -= 20;
        }

        if (code.includes("console.log") || code.includes("System.out.println")) {
          issues.push({
            title: "Debug prints found",
            suggestion: "Remove debug logs in production",
            penalty: 10
          });
          score -= 10;
        }

        if (code.includes("Exception")) {
          issues.push({
            title: "Generic exception handling",
            suggestion: "Use specific exceptions",
            penalty: 10
          });
          score -= 10;
        }

      } catch (analysisError) {
        console.error("Analysis logic failed:", analysisError);
      }

      score = Math.max(0, score);

      return res.json({
        type: "analyze",
        score,
        issues,
        code,
        id: codeData.id // 🔥 IMPORTANT (frontend needs this)
      });
    }

    return res.status(400).json({ error: "Invalid share type" });

  } catch (err) {
    console.error("🔥 SHARE ERROR:", err); // 👈 CHECK THIS IN TERMINAL
    res.status(500).json({ error: err.message });
  }
};






module.exports = {
  pasteCode: exports.pasteCode,
  uploadFile: exports.uploadFile,
  getHistory: exports.getHistory,
  getAnalysisHistory: exports.getAnalysisHistory,
  getCodeById: exports.getCodeById,
  updateCode: exports.updateCode,
  softDeleteCode: exports.softDeleteCode,
  getDeletedCodes: exports.getDeletedCodes,
  undoDelete: exports.undoDelete,
  getDashboardStats: exports.getDashboardStats,
  getRecentScans: exports.getRecentScans,
  analyzeCode: exports.analyzeCode,
  getFileAnalysisTimeline: exports.getFileAnalysisTimeline,
  getRecurringIssues: exports.getRecurringIssues,   // ✅ add this
  getAISuggestions: exports.getAISuggestions,  
  getCodeVersions: exports.getCodeVersions,
  getAllVersionsGrouped: exports.getAllVersionsGrouped,
  generateShareLink: exports.generateShareLink,
  getSharedData: exports.getSharedData,
  togglePin: exports.togglePin

  
};
// Your other existing functions (paste, delete, etc.)
exports.createSubmission = async (req, res) => {
  // Your existing paste code...
};
exports.deleteSubmission = async (req, res) => {
  // Your existing delete code...
};

