const pool = require("../config/db");
const fetch = require("node-fetch");
const axios = require("axios");

const explainCode = async (req, res) => {
  try {
    const { code, language = "javascript" } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Code required" });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key" });
    }

    const lines = code.split("\n").filter((l) => l.trim()).length;
    const functions = (code.match(/function\s+\w+|=>|def\s+\w+/g) || []).length;
    const loops = (code.match(/(for|while|forEach)\s*\(/g) || []).length;

    const metrics = {
      lines,
      functions: functions || 0,
      loops: loops || 0,
      complexity: loops >= 2 ? "O(n²)" : loops === 1 ? "O(n)" : "O(1)",
    };

    let explanation = "Code analysis complete";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AI Code Analyzer",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            {
              role: "user",
              content: `Give **line-by-line explanation** + **execution flow** + **summary** for this ${language} code:

**CODE:**
\`\`\`${language}
${code}
\`\`\`

Format: Line-by-line → Flow → Summary`,
            },
          ],
          max_tokens: 1200,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ OpenRouter Error:", data);
        throw new Error("AI failed");
      }

      explanation = data.choices?.[0]?.message?.content || explanation;
    } catch (e) {
      explanation = `**Line-by-line:** ${lines} lines executed
**Flow:** ${functions} functions → ${loops} loops
**Summary:** ${language} code with ${metrics.complexity} complexity`;
    }

    const optimizationSuggestions = [];

    if (lines > 100) {
      optimizationSuggestions.push("📂 Code is large. Consider breaking into smaller functions.");
    }
    if (functions > 5) {
      optimizationSuggestions.push("⚠️ Too many functions. Try modularizing or grouping related logic.");
    }
    if (loops >= 2) {
      optimizationSuggestions.push("🚨 Nested loops detected. This may cause O(n²) complexity. Optimize using better algorithms.");
    }
    if (loops === 1) {
      optimizationSuggestions.push("💡 Single loop detected. Performance is good (O(n)), but ensure it's necessary.");
    }
    if (functions === 0) {
      optimizationSuggestions.push("⚠️ No functions found. Consider using functions for better structure and reusability.");
    }
    if (lines > 50 && functions <= 1) {
      optimizationSuggestions.push("⚠️ Long function detected. Break into smaller reusable functions.");
    }

    res.json({
      explanation,
      lineByLine: code.split("\n").map((l, i) => ({ line: i + 1, code: l.trim() })),
      metrics,
      summary: `${language} code: ${lines} lines, ${metrics.complexity} time`,
      optimizationSuggestions,
    });
  } catch (err) {
    console.error("Explain code error:", err.message);
    res.status(500).json({ message: "Analysis failed" });
  }
};

const getUserCodes = async (req, res) => {
  try {
    const userId = req.userId;
    const result = await pool.query(
      "SELECT id, file_name, language, status, code FROM code_submissions WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching codes" });
  }
};

const getFailureExplanation = async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "Missing OpenRouter API key" });
    }
    console.log("OpenRouter key loaded:", !!process.env.OPENROUTER_API_KEY);
    const { code, input, expected, output } = req.body;

    if (!code || input === undefined || expected === undefined || output === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
You are an expert coding interviewer.

Analyze the following:

CODE:
${code}

TEST CASE:
Input: ${input}
Expected Output: ${expected}
Actual Output: ${output}

TASK:
1. Identify EXACT reason why test case failed
2. Explain mistake in simple words
3. Tell what type of error:
   (logic / edge case / input parsing / performance / formatting / wrong expected output)
4. Give hint to fix (DO NOT give full code)
5. Mention what kind of inputs will fail because of this mistake

FORMAT:

❌ Reason:
...

📌 Error Type:
...

💡 Hint:
...

⚠️ Failing Cases:
...

Keep explanation simple for students.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AI Code Analyzer",
        },
        timeout: 30000,
      }
    );

    const explanation =
      response.data?.choices?.[0]?.message?.content || "⚠️ AI returned empty response";

    res.json({ explanation });
  } catch (err) {
    console.error("OpenRouter status:", err.response?.status);
    console.error("OpenRouter data:", err.response?.data || err.message);
    res.status(500).json({ error: "AI explanation failed" });
  }
};

module.exports = {
  explainCode,
  getUserCodes,
  getFailureExplanation,
};