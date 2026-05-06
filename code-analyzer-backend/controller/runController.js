const fs = require("fs");
const path = require("path");
const { runInDocker } = require("../utils/dockerRunner");
const { parseInput } = require("../utils/inputParser");
const axios = require("axios");

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
      const parsedInput = parseInput(test.input);

      const result = await runInDocker(dir, language, parsedInput);;

      let status = result.status;
      let explanation = "✅ Passed";

      if (status === "Success" && test.expectedOutput) {
        const actual = result.output.trim();
        const expected = test.expectedOutput.trim();

        if (actual === expected) {
          status = "Accepted";
        } else {
          status = "Wrong Answer";

       try {
          const aiRes = await axios.post(
            "http://localhost:5000/api/explain/failure-explanation",
            {
              code,
              input: test.input,
              expected: test.expectedOutput,
              output: result.output
            },
            {
              headers: {
                Authorization: req.headers.authorization || ""
              },
              timeout: 30000
            }
          );

          explanation = aiRes.data.explanation;
        } catch (err) {
          console.error("AI error:", err.response?.status, err.response?.data || err.message);
          explanation = "❌ AI explanation failed";
        }
                    }
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
        explanation   
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