// utils/inputParser.js

function parseInput(input) {
  if (!input) return "";

  input = input.trim();

  try {
    // ✅ Detect array format
    if (input.startsWith("[") && input.endsWith("]")) {
      const parsed = JSON.parse(input);

      // 🔹 1D Array → [1,2,3]
      if (Array.isArray(parsed) && !Array.isArray(parsed[0])) {
        return parsed.join(" ");
      }

      // 🔹 2D Array → [[1,2],[3,4]]
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        return parsed.map(row => row.join(" ")).join("\n");
      }
    }
  } catch (err) {
    console.warn("Input parse failed, using raw input");
  }

  // fallback → original input
  return input;
}

module.exports = { parseInput };