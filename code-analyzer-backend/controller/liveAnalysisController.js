const diff = require("diff");

exports.liveAnalysis = async (req, res) => {
  try {
    const { oldCode, newCode } = req.body;

    if (!oldCode || !newCode) {
      return res.status(400).json({ error: "Both oldCode and newCode required" });
    }

    const changes = diff.diffLines(oldCode, newCode);
    let analysis = [];

    changes.forEach((part, index) => {
      if (!part.added) return;

      const newLine = part.value.trim();

   
      if (/for\s*\(|while\s*\(/.test(newLine)) {


        if (/<=/.test(newLine)) {
          analysis.push({
            type: "Loop Modification",
            title: "Loop Boundary Changed",
            severity: "MEDIUM",
            line: index + 1,
            whatChanged: "Loop condition modified to include additional iteration.",
            impact: [
              "Loop executes one extra time",
              "May access invalid array index",
              "Slight performance overhead"
            ],
            scenario: "If used with arrays, it may cause out-of-bounds exception.",
            suggestion: "Use i < n instead of i <= n"
          });
        }


        if (/while\s*\(\s*true\s*\)/.test(newLine)) {
          analysis.push({
            type: "Infinite Loop",
            title: "Infinite Loop Detected",
            severity: "HIGH",
            line: index + 1,
            whatChanged: "A loop without termination condition was introduced.",
            impact: [
              "Program will never stop executing",
              "CPU usage may reach 100%",
              "Application may freeze or crash"
            ],
            scenario: "In production, this can block server threads and crash systems.",
            suggestion: "Add break condition or exit logic"
          });
        }


        if (/for\s*\(.*;.*;.*\)/.test(newLine) && !/i\+\+|--/.test(newLine)) {
          analysis.push({
            type: "Loop Update Missing",
            title: "Loop Increment Missing",
            severity: "HIGH",
            line: index + 1,
            whatChanged: "Loop increment/decrement step removed.",
            impact: [
              "Loop may never terminate",
              "Infinite execution possible"
            ],
            scenario: "System may hang due to uncontrolled loop.",
            suggestion: "Ensure loop has increment or decrement"
          });
        }
      }


      if (/if\s*\(/.test(newLine)) {

        if (/==/.test(newLine) && !/===/.test(newLine)) {
          analysis.push({
            type: "Loose Equality",
            title: "Weak Equality Comparison",
            severity: "MEDIUM",
            line: index + 1,
            whatChanged: "Used '==' instead of strict equality.",
            impact: [
              "Type coercion may occur",
              "Unexpected comparison results"
            ],
            scenario: "Comparing number and string may return incorrect results.",
            suggestion: "Use === instead of =="
          });
        }

        if (/!=/.test(newLine) && !/!==/.test(newLine)) {
          analysis.push({
            type: "Loose Inequality",
            title: "Weak Inequality Comparison",
            severity: "MEDIUM",
            line: index + 1,
            whatChanged: "Used '!=' instead of strict inequality.",
            impact: [
              "Unexpected behavior due to type conversion"
            ],
            scenario: "Incorrect comparisons may break logic.",
            suggestion: "Use !== instead of !="
          });
        }
      }


      if (/arr\[.*\+.*\]/.test(newLine)) {
        analysis.push({
          type: "Array Index Shift",
          title: "Array Index Manipulation",
          severity: "MEDIUM",
          line: index + 1,
          whatChanged: "Array index calculation modified.",
          impact: [
            "May skip elements",
            "Possible out-of-bounds access"
          ],
          scenario: "Invalid index can crash program.",
          suggestion: "Ensure index remains within bounds"
        });
      }

      if (/arr\[.*-.*\]/.test(newLine)) {
        analysis.push({
          type: "Negative Index Risk",
          title: "Negative Index Access",
          severity: "HIGH",
          line: index + 1,
          whatChanged: "Array index decreased dynamically.",
          impact: [
            "Negative index access",
            "Runtime error possible"
          ],
          scenario: "Accessing negative index causes crash.",
          suggestion: "Ensure index >= 0"
        });
      }


      if (/\.size/.test(newLine)) {
        analysis.push({
          type: "Invalid String Property",
          title: "Invalid String Property Usage",
          severity: "HIGH",
          line: index + 1,
          whatChanged: "Used incorrect string property '.size'.",
          impact: [
            "Undefined error",
            "Code execution fails"
          ],
          scenario: "String operations break at runtime.",
          suggestion: "Use .length instead"
        });
      }


      if (/\/\s*0/.test(newLine)) {
        analysis.push({
          type: "Division by Zero",
          title: "Division by Zero Detected",
          severity: "CRITICAL",
          line: index + 1,
          whatChanged: "Division operation with zero denominator.",
          impact: [
            "Program crash",
            "Infinity or exception"
          ],
          scenario: "Unstable results or system failure.",
          suggestion: "Check denominator before division"
        });
      }


      if (/\w+\(.*\)/.test(newLine) && /,\s*\)/.test(newLine)) {
        analysis.push({
          type: "Function Argument Issue",
          title: "Invalid Function Arguments",
          severity: "MEDIUM",
          line: index + 1,
          whatChanged: "Incorrect function arguments passed.",
          impact: [
            "Function may fail",
            "Unexpected output"
          ],
          scenario: "Missing parameters break logic.",
          suggestion: "Validate function arguments"
        });
      }

      if (/eval\s*\(/.test(newLine)) {
        analysis.push({
          type: "Code Injection Risk",
          title: "Use of eval() Detected",
          severity: "CRITICAL",
          line: index + 1,
          whatChanged: "Dynamic code execution introduced.",
          impact: [
            "Security vulnerability",
            "Remote code execution risk"
          ],
          scenario: "Attackers can execute malicious code.",
          suggestion: "Avoid eval(), use safe alternatives"
        });
      }

      if (/innerHTML\s*=/.test(newLine)) {
        analysis.push({
          type: "XSS Risk",
          title: "Unsafe DOM Injection",
          severity: "HIGH",
          line: index + 1,
          whatChanged: "Direct DOM injection using innerHTML.",
          impact: [
            "Cross-site scripting attack",
            "User data compromise"
          ],
          scenario: "Malicious scripts can run in browser.",
          suggestion: "Use textContent or sanitize input"
        });
      }


      if (/null|undefined/.test(newLine)) {
        analysis.push({
          type: "Null Safety Issue",
          title: "Null/Undefined Usage",
          severity: "MEDIUM",
          line: index + 1,
          whatChanged: "Null or undefined value used.",
          impact: [
            "Runtime crash",
            "Unexpected failures"
          ],
          scenario: "Null pointer exception possible.",
          suggestion: "Add null checks"
        });
      }


      if (/await/.test(newLine) && !/async/.test(oldCode)) {
        analysis.push({
          type: "Async Misuse",
          title: "Invalid Async Usage",
          severity: "HIGH",
          line: index + 1,
          whatChanged: "Used await without async function.",
          impact: [
            "Syntax error",
            "Code will not run"
          ],
          scenario: "Application fails during execution.",
          suggestion: "Use async function"
        });
      }

    });

    res.json({ analysis });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const axios = require("axios");

exports.aiAnalyzeChange = async (req, res) => {
  try {
    const { oldCode, newCode } = req.body;

    const prompt = `
You are an expert software engineer.

Analyze the difference between OLD CODE and NEW CODE.

Explain:
1. What changed
2. How it affects logic
3. Runtime risks
4. Performance impact
5. Edge cases
6. Give clear suggestion

OLD CODE:
${oldCode}

NEW CODE:
${newCode}

Respond in clean bullet points.
`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      explanation: response.data.choices[0].message.content
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "AI analysis failed" });
  }
};