const axios = require("axios");

exports.predictBehavior = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: "Code and language required" });
    }

    const prompt = `
You are an expert coding mentor.

Analyze the given code and predict its behavior WITHOUT running it.

CODE:
${code}

TASK:
1. What type of inputs will work correctly?
2. What type of inputs will fail?
3. Mention edge cases
4. Detect possible logical mistakes
5. Suggest improvements

FORMAT:

📊 Behavior Prediction:

✔ Works for:
...

❌ May fail for:
...

⚠️ Edge Cases:
...

💡 Suggestions:
...
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "AI Code Analyzer"
        }
      }
    );

    const prediction =
      response.data?.choices?.[0]?.message?.content ||
      "⚠️ No prediction available";

    res.json({ prediction });

  } catch (err) {
    console.error("Prediction Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Prediction failed" });
  }
};