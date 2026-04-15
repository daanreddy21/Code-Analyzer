const fs = require("fs");
const path = require("path");
const { runInDocker } = require("../utils/dockerRunner");

exports.runCode = async (req, res) => {
  const { code, language, testCases } = req.body;

  if (!code || !language || !testCases || !Array.isArray(testCases)) {
    return res.status(400).json({ error: "Invalid request: code, language, and testCases array required" });
  }

  const jobId = Date.now().toString();
  const dir = path.join(__dirname, `../../temp/${jobId}`);
  
  try {
    fs.mkdirSync(dir, { recursive: true });

    let fileName = "";
    if (language === "java") fileName = "Main.java";
    else if (language === "python") fileName = "main.py";
    else if (language === "cpp") fileName = "main.cpp";
    else return res.status(400).json({ error: `Unsupported language: ${language}` });

    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, code);

    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const test = testCases[i];
      const result = await runInDocker(dir, language, test.input || "");

      let status = result.status;
      if (status === "Success" && test.expectedOutput) {
        const actual = result.output.trim();
        const expected = test.expectedOutput.trim();
        status = actual === expected ? "Accepted" : "Wrong Answer";
      } else if (status === "Success") {
        status = "Run Success";
      }

      results.push({
        testNumber: i + 1,
        input: test.input || "",
        expected: test.expectedOutput || "",
        output: result.output || "",
        status,
        executionTime: result.executionTime || "N/A",
      });
    }

    res.json({ results });

  } catch (err) {
    console.error("Run code error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    try {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
  }
};