// utils/inputParser.js

function parseInput(input) {
  if (!input) return "";

  input = input.trim();

  try {
    
    if (input.startsWith("[") && input.endsWith("]")) {
      const parsed = JSON.parse(input);

      
      if (Array.isArray(parsed) && !Array.isArray(parsed[0])) {
        return parsed.join(" ");
      }

      
      if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
        return parsed.map(row => row.join(" ")).join("\n");
      }
    }
  } catch (err) {
    console.warn("Input parse failed, using raw input");
  }

  
  return input;
}

module.exports = { parseInput };