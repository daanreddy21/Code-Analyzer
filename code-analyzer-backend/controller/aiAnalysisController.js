const axios = require("axios");

exports.aiAnalyze = async (req, res) => {
  try {
    const { oldCode, newCode, language } = req.body;

    if (!newCode) {
      return res.status(400).json({ error: "newCode required" });
    }

    const prompt = `
You are an expert software engineer.

Analyze the difference between OLD CODE and NEW CODE.

Language: ${language || "auto-detect"}

Return STRICT JSON (no extra text) in this format:

[
  {
    "title": "",
    "severity": "LOW | MEDIUM | HIGH | CRITICAL",
    "line": number,
    "whatChanged": "",
    "impact": ["", ""],
    "scenario": "",
    "suggestion": ""
  }
]

Focus on:
- logic errors
- runtime issues
- security risks
- performance issues
- language-specific correctness

OLD CODE:
${oldCode || "N/A"}

NEW CODE:
${newCode}
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let content = response.data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.json({ analysis: [] });
    }

    res.json({ analysis: parsed });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};