
const multer = require("multer");
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");


const upload = multer({
  storage: multer.diskStorage({
    destination: "uploads/projects/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).single("projectFile");


function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}


function detectProjectType(files) {
  let hasFrontend = false;
  let hasBackend = false;

  files.forEach((f) => {
    const lower = f.toLowerCase();

    
    if (
      lower.endsWith(".html") ||
      lower.endsWith(".css") ||
      lower.endsWith(".jsx") ||
      lower.endsWith(".tsx") ||
      lower.includes("react") ||
      lower.includes("angular") ||
      lower.includes("vue")
    ) {
      hasFrontend = true;
    }

  
    if (
      lower.endsWith(".py") ||
      lower.endsWith(".php") ||
      lower.includes("controller") ||
      lower.includes("route") ||
      lower.includes("server") ||
      lower.includes("app") ||
      lower.includes("backend") ||
      lower.includes("spring")
    ) {
      hasBackend = true;
    }
  });

  if (hasFrontend && hasBackend) return "FULL_STACK";
  if (hasFrontend) return "FRONTEND";
  if (hasBackend) return "BACKEND";
  return "UNKNOWN";
}


function checkCodeQuality(content, filePath) {
  const issues = [];


  if (/let\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*;/.test(content) && !content.includes("console.log")) {
    issues.push({
      category: "code_quality",
      subType: "unused_variable",
      message: "Unused variable detected",
      suggestion: "Remove unused variables and simplify code",
      severity: "LOW",
      file: filePath,
    });
  }


  const lines = content.split("\n");
  if (lines.length > 150) {
    issues.push({
      category: "code_quality",
      subType: "large_function",
      message: "Very large function / file",
      suggestion: "Break into smaller functions/components",
      severity: "MEDIUM",
      file: filePath,
    });
  }


  if (/\b[a-zA-Z]\b\s*=\s*/.test(content)) {
    issues.push({
      category: "code_quality",
      subType: "bad_naming",
      message: "Single‑letter variable / bad naming",
      suggestion: "Use meaningful variable/function names",
      severity: "LOW",
      file: filePath,
    });
  }

  return issues;
}


function checkPerformance(content, filePath, projectType) {
  const issues = [];


  if (content.includes("useEffect")) {
    if (!content.includes("],") && !content.includes("useEffect([],")) {
      issues.push({
        category: "performance",
        subType: "missing_deps",
        message: "useEffect missing dependency array",
        suggestion: "Add correct dependency array or use empty [] if needed",
        severity: "MEDIUM",
        file: filePath,
      });
    }
  }


  const lower = filePath.toLowerCase();
  if (
    (lower.endsWith(".jpg") || lower.endsWith(".png") || lower.endsWith(".jpeg")) &&
    projectType === "FRONTEND"
  ) {
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 500 * 1024) {
        issues.push({
          category: "performance",
          subType: "large_image",
          message: "Large image file detected",
          suggestion: "Optimize/compress images and use modern formats (WebP)",
          severity: "MEDIUM",
          file: filePath,
        });
      }
    } catch {}
  }

  return issues;
}

function checkSecurity(content, filePath, allFiles) {
  const issues = [];

  if (
    (content.includes("SELECT") || content.includes("INSERT") || content.includes("UPDATE")) &&
    content.includes("+")
  ) {
    issues.push({
      category: "security",
      subType: "sql_injection",
      message: "Potentially unsafe SQL concatenation",
      suggestion: "Use parameterized/prepared statements or ORM",
      severity: "HIGH",
      file: filePath,
    });
  }


  if (content.includes("password") || content.includes("secret") || content.includes("API_KEY")) {
    if (!content.includes(".env")) {
      issues.push({
        category: "security",
        subType: "hardcoded_secret",
        message: "Possible hardcoded secret/password",
        suggestion: "Move secrets into .env and use environment variables",
        severity: "HIGH",
        file: filePath,
      });
    }
  }


  const authPatterns = allFiles.some((f) =>
    f.toLowerCase().includes("auth") || f.toLowerCase().includes("login")
  );
  if (!authPatterns && content.includes("password")) {
    issues.push({
      category: "security",
      subType: "missing_auth",
      message: "No clear authentication logic found",
      suggestion: "Add JWT or OAuth based authentication",
      severity: "HIGH",
      file: "N/A",
    });
  }

  return issues;
}


function checkUIUX(content, filePath, projectType) {
  const issues = [];

  if (projectType === "FRONTEND" || filePath.toLowerCase().endsWith(".html")) {

    if (
      content.includes("<html") &&
      !content.includes("viewport") &&
      !content.includes("grid") &&
      !content.includes("flex")
    ) {
      issues.push({
        category: "ui_ux",
        subType: "no_responsive",
        message: "No clear responsive design (missing viewport, grid, flex)",
        suggestion: "Use Flexbox/Grid and add meta viewport for mobile",
        severity: "MEDIUM",
        file: filePath,
      });
    }


    if (content.includes("<img") && !content.includes("alt=")) {
      issues.push({
        category: "ui_ux",
        subType: "missing_alt",
        message: "Image without alt text",
        suggestion: "Add descriptive alt text for accessibility",
        severity: "LOW",
        file: filePath,
      });
    }
  }

  return issues;
}


function checkAPIIntegration(content, filePath, projectType, allFiles) {
  const issues = [];

  
  if (content.includes("fetch(") && projectType !== "BACKEND") {
    if (!content.includes("/api/") && !content.includes("http")) {
      issues.push({
        category: "api_integration",
        subType: "wrong_endpoint",
        message: "API endpoint may not follow /api/ pattern",
        suggestion: "Match backend routes; e.g., /api/users",
        severity: "MEDIUM",
        file: filePath,
      });
    }
  }


  if (
    content.includes("response.json()") &&
    !content.includes("data.")
  ) {
    issues.push({
      category: "api_integration",
      subType: "data_mismatch",
      message: "API response structure may be unclear",
      suggestion: "Ensure consistent response format (e.g., { data, error })",
      severity: "MEDIUM",
      file: filePath,
    });
  }

  return issues;
}


function checkErrorHandling(content, filePath) {
  const issues = [];

  
  if (content.includes("await") && !content.includes("try")) {
    issues.push({
      category: "error_handling",
      subType: "missing_try_catch",
      message: "Async code without try‑catch",
      suggestion: "Wrap async code in try‑catch or use error boundaries",
      severity: "HIGH",
      file: filePath,
    });
  }

  
  if (content.includes("catch") || content.includes(".catch")) {
    
  } else if (content.includes("fetch(") || content.includes("axios")) {
    issues.push({
      category: "error_handling",
      subType: "no_error_handling",
      message: "No explicit error handling on API call",
      suggestion: "Add catch blocks or global error handler",
      severity: "MEDIUM",
      file: filePath,
    });
  }

  return issues;
}


function checkArchitecture(allFiles, projectType, projectDir) {
  const issues = [];

  
  const hasSrc = allFiles.some((f) => f.includes("src"));
  const hasControllers = allFiles.some((f) => f.toLowerCase().includes("controller"));
  const hasRoutes = allFiles.some((f) => f.toLowerCase().includes("route"));
  const hasModels = allFiles.some((f) => f.toLowerCase().includes("model"));
  const hasComponents = allFiles.some((f) => f.toLowerCase().includes("component"));

  if (!hasSrc) {
    issues.push({
      category: "architecture",
      subType: "no_src_structure",
      message: "No clear src/ folder structure",
      suggestion: "Create src/, components/, pages/, services/, etc.",
      severity: "MEDIUM",
      file: "N/A",
    });
  }

  if (projectType === "BACKEND" && (!hasControllers || !hasRoutes || !hasModels)) {
    issues.push({
      category: "architecture",
      subType: "poor_mvc",
      message: "Backend lacks clear MVC‑like structure",
      suggestion: "Create controllers, routes, models, services folders",
      severity: "MEDIUM",
      file: "N/A",
    });
  }

  if (projectType === "FRONTEND" && !hasComponents) {
    issues.push({
      category: "architecture",
      subType: "no_components",
      message: "No clear component structure",
      suggestion: "Create reusable components and pages folders",
      severity: "MEDIUM",
      file: "N/A",
    });
  }


  const hasNodeFiles = allFiles.some((f) => f.endsWith("server.js") || f.endsWith("app.js"));
  const hasFrontendDir = allFiles.some((f) => f.includes("public") || f.includes("dist"));

  if (hasNodeFiles && hasFrontendDir) {
    if (!allFiles.some((f) => f.includes("backend") || f.includes("frontend"))) {
      issues.push({
        category: "architecture",
        subType: "mixed_logic",
        message: "Frontend and backend code mixed in one folder",
        suggestion: "Separate into backend/ and frontend/ folders",
        severity: "MEDIUM",
        file: "N/A",
      });
    }
  }

  return issues;
}


function calculateScore(issues) {
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === "HIGH") score -= 10;
    else if (issue.severity === "MEDIUM") score -= 5;
    else if (issue.severity === "LOW") score -= 2;
  });
  return score < 0 ? 0 : score;
}


function categorizeIssues(issues) {
  const grouped = {
    code_quality: [],
    performance: [],
    security: [],
    ui_ux: [],
    api_integration: [],
    error_handling: [],
    architecture: [],
  };

  issues.forEach((issue) => {
    if (grouped[issue.category]) {
      grouped[issue.category].push(issue);
    }
  });

  return grouped;
}


function generateSuggestions(issues) {
  const suggestionsSet = new Set();
  issues.forEach((issue) => suggestionsSet.add(issue.suggestion));
  return Array.from(suggestionsSet);
}


function generateSummary(issues) {
  const summary = { total: issues.length, high: 0, medium: 0, low: 0 };
  issues.forEach((issue) => {
    if (issue.severity === "HIGH") summary.high++;
    else if (issue.severity === "MEDIUM") summary.medium++;
    else summary.low++;
  });
  return summary;
}


exports.submitProject = async (req, res) => {
  const { title, domain, database_type, tech_stack, description, course_name } = req.body;
  const user_id = req.userId;

  if (!user_id) return res.status(401).json({ error: "User not authenticated" });
  if (!title || !domain)
    return res.status(400).json({ error: "Title and domain required" });
  if (!req.file) return res.status(400).json({ error: "Project file required" });

  const existing = await pool.query(
    "SELECT * FROM project_submissions WHERE user_id=$1 AND title=$2",
    [user_id, title]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: "Project with this title already exists" });
  }

  const filePath = req.file.path;
  const fileData = fs.readFileSync(filePath);


  const zip = new AdmZip(filePath);
  const extractPath = path.join("uploads/projects_extracted", Date.now().toString());
  fs.mkdirSync(extractPath, { recursive: true });
  zip.extractAllTo(extractPath, true);
  const allFiles = getAllFiles(extractPath);


  const projectType = detectProjectType(allFiles);


  let allIssues = [];

  allFiles.forEach((filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const lowerFile = filePath.toLowerCase();

    try {
      const content = fs.readFileSync(filePath, "utf-8");


      if ([".js", ".jsx", ".ts", ".tsx", ".html", ".py", ".php", ".java"].some((e) => ext === e)) {
        allIssues.push(...checkCodeQuality(content, filePath));
        allIssues.push(...checkPerformance(content, filePath, projectType));
        allIssues.push(...checkSecurity(content, filePath, allFiles));
        allIssues.push(...checkUIUX(content, filePath, projectType));
        allIssues.push(...checkAPIIntegration(content, filePath, projectType, allFiles));
        allIssues.push(...checkErrorHandling(content, filePath));
      }
    } catch {}
  });


  allIssues.push(...checkArchitecture(allFiles, projectType, extractPath));


  const score = calculateScore(allIssues);
  const categories = categorizeIssues(allIssues);
  const suggestions = generateSuggestions(allIssues);
  const summary = generateSummary(allIssues);


  await pool.query(
    `INSERT INTO project_submissions(
      user_id, title, domain, database_type, tech_stack, description, 
      file_path, file_data, course_name, project_type, issues, score
    ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      user_id,
      title,
      domain,
      database_type || null,
      tech_stack || null,
      description || null,
      filePath,
      fileData,
      course_name || null,
      projectType,
      JSON.stringify(allIssues),
      score,
    ]
  );


  return res.json({
    message: "Project analyzed successfully",
    title,
    domain,
    course_name,
    projectType,
    totalFiles: allFiles.length,
    totalIssues: allIssues.length,
    score,
    summary,
    categories,
    suggestions,
  });
};
   


exports.getMySubmissions = async (req, res) => {
  try {
    const user_id = req.userId;
    const result = await pool.query(
      `SELECT id, title, domain, database_type, tech_stack, course_name, 
              file_path, description, submit_date, 
              project_type, score, issues  -- ADD THESE THREE
       FROM project_submissions 
       WHERE user_id=$1 
       ORDER BY submit_date DESC`,
      [user_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.downloadProjectFile = async (req, res) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;

   
    const result = await pool.query(
      "SELECT file_data, title, file_path FROM project_submissions WHERE id=$1 AND user_id=$2",
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "File not found or unauthorized" });
    }

    const { file_data, title, file_path } = result.rows[0];
    const extension = path.extname(file_path); // e.g., .zip or .py
    const downloadName = `${title}${extension}`;

    // 🔥 FASTER: Download directly from Database binary (BYTEA)
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.send(file_data);
  } catch (err) {
    console.error("❌ DOWNLOAD ERROR:", err);
    res.status(500).json({ error: "Could not download file" });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const user_id = req.userId;
    const { id } = req.params;

    const existing = await pool.query(
      "SELECT * FROM project_submissions WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Project not found or unauthorized" });
    }

    await pool.query(
      "DELETE FROM project_submissions WHERE id = $1 AND user_id = $2",
      [id, user_id]
    );

    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("DELETE PROJECT ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};
// ✅ Export multer middleware so route can use it
exports.upload = upload;
