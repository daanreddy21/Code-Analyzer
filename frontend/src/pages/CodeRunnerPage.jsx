import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom"; // ✅ Added missing import
import API from "../services/api";
import Editor, { loader } from "@monaco-editor/react";


function CodeRunnerPage() {
  const navigate = useNavigate(); // ✅ Fixed missing navigate hook
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "" }]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("run");
  const [activeTab, setActiveTab] = useState("testcases");
  const [title, setTitle] = useState("");
  const location = useLocation();
  const [currentCodeId, setCurrentCodeId] = useState(null);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // ✅ PERFECTED DARK THEME STYLES WITH HEADER & FOOTER
  const darkThemeStyles = {
    // HEADER STYLES
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      height: "70px",
      background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
      boxShadow: "0 4px 20px rgba(30, 58, 138, 0.3)",
      zIndex: 1000,
      backdropFilter: "blur(10px)"
    },
    headerContent: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      padding: "0 20px"
    },
    headerLeft: {
      display: "flex",
      alignItems: "center"
    },
    headerH1: {
      margin: 0,
      fontSize: "24px",
      fontWeight: "bold",
      background: "linear-gradient(135deg, #60a5fa 0%, #ffffff 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text"
    },
    headerRight: {
      display: "flex",
      gap: "12px",
      alignItems: "center"
    },
    navBtn: {
      padding: "10px 20px",
      backgroundColor: "rgba(255, 255, 255, 0.1)",  // ✅ Explicit
      color: "#e2e8f0",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
      textDecoration: "none"
    },
    navBtnHighlight: {
      background: "rgba(255, 255, 255, 0.2)",
      borderColor: "rgba(255, 255, 255, 0.4)",
      boxShadow: "0 0 20px rgba(255, 255, 255, 0.1)"
    },
    logoutBtn: {
      background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      borderColor: "rgba(220, 38, 38, 0.5)",
      color: "white"
    },

    // FOOTER STYLES
    footer: {
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: "60px",
      background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
      borderTop: "1px solid #374151",
      boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
      zIndex: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    },
    footerContent: {
      color: "#94a3b8",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "20px"
    },

    // MAIN CONTAINER - Adjusted for fixed header/footer
    container: {
      display: "flex",
      height: "calc(100vh - 130px)", // Header(70px) + Footer(60px)
      marginTop: "70px",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#0f0f23",
      color: "#e5e7eb"
    },

    // Rest of existing styles...
    leftSide: {
      flex: 2,
      padding: "20px",
      overflow: "auto",
      backgroundColor: "#111827"
    },
    h2: {
      marginTop: 0,
      color: "#f9fafb",
      borderBottom: "1px solid #374151",
      paddingBottom: "10px"
    },
    label: {
      color: "#d1d5db",
      fontWeight: "600",
      display: "block",
      marginBottom: "5px"
    },
    select: {
      padding: "8px 12px",
      fontSize: "14px",
      backgroundColor: "#1f2937",
      color: "#f9fafb",
      border: "1px solid #4b5563",
      borderRadius: "6px",
      width: "120px"
    },
    button: {
      padding: "10px 20px",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.2s"
    },
    runBtn: {
      background: "#1e40af"
    },
    submitBtn: {
      background: "#059669"
    },
    disabledBtn: {
      background: "#4b5563",
      cursor: "not-allowed",
      opacity: 0.6
    },
    textarea: {
      width: "100%",
      padding: "12px",
      border: "1px solid #4b5563",
      borderRadius: "6px",
      fontFamily: "monospace",
      fontSize: "14px",
      backgroundColor: "#1f2937",
      color: "#f9fafb",
      resize: "vertical"
    },
    console: {
      marginTop: "10px",
      background: "#111827",
      color: "#10b981",
      padding: "15px",
      height: "150px",
      overflowY: "auto",
      fontFamily: "monospace",
      borderRadius: "6px",
      border: "1px solid #374151"
    },
    rightSide: {
      flex: 1,
      borderLeft: "1px solid #374151",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#0f172a"
    },
    tabHeader: {
      display: "flex",
      background: "#1e293b",
      padding: "10px",
      borderBottom: "1px solid #334155"
    },
    tabBtn: {
      flex: 1,
      padding: "8px 12px",
      border: "none",
      fontSize: "13px",
      color: "#94a3b8",
      cursor: "pointer",
      borderRadius: "6px",
      transition: "all 0.2s",
      backgroundColor: "transparent"
    },
    activeTabBtn: {
      background: "#1e40af",
      color: "white"
    },
    testCase: {
      marginBottom: "15px",
      padding: "15px",
      border: "1px solid #475569",
      borderRadius: "8px",
      backgroundColor: "#1e293b"
    },
    resultItem: {
      marginBottom: "15px",
      padding: "15px",
      borderRadius: "8px",
      border: "1px solid #475569"
    },
    tabContent: {
      flex: 1,
      padding: "20px",
      overflow: "auto",
      backgroundColor: "#0f172a"
    }
  };

  

useEffect(() => {
  if (location.state) {
    const data = location.state;

    setCode(data.code);
    setLanguage(data.language);
    setTitle(data.title);
    setCurrentCodeId(data.id);

    // ✅ SAVE LAST OPENED FILE
    localStorage.setItem("lastOpenedCode", JSON.stringify(data));

    // ✅ CLEAR NAV STATE
    window.history.replaceState({}, document.title);
  } else {
    // ✅ RESTORE AFTER REFRESH
    const saved = localStorage.getItem("lastOpenedCode");

    if (saved) {
      const data = JSON.parse(saved);

      setCode(data.code);
      setLanguage(data.language);
      setTitle(data.title);
      setCurrentCodeId(data.id);
    }
  }
}, [location.state]);

useEffect(() => {
  if (!currentCodeId || !code.trim()) return;

  const timeout = setTimeout(() => {
    console.log("🔥 Auto saving ID:", currentCodeId);

    API.put(`/code/${currentCodeId}`, { code })
      .then(() => console.log("✅ Auto-saved to DB"))
      .catch(err => console.error("❌ Auto-save error:", err));
  }, 2000);

  return () => clearTimeout(timeout);
}, [code, currentCodeId]);

  useEffect(() => {
  const timeout = setTimeout(() => {
    const key = currentCodeId 
      ? `autosave_${currentCodeId}` 
      : `autosave_${language}`;

    localStorage.setItem(key, code);
  }, 500);

  return () => clearTimeout(timeout);
}, [code, language, currentCodeId]);

  // ✅ FIXED MONACO WORKER SETUP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getWorkerUrl = (moduleId, label) => {
        if (label === 'json') return '/editor.worker.js';
        if (['css', 'scss', 'less', 'html'].includes(label)) return '/html.worker.js';
        if (['typescript', 'javascript'].includes(label)) return '/ts.worker.js';
        return '/editor.worker.js';
      };
      // @ts-ignore
      window.MonacoEnvironment = { getWorkerUrl };
    }
  }, []);

  // ✅ FIXED DEFAULT CODE
  const getDefaultCode = (lang) => {
    if (lang === "java") {
      return `import java.util.*;
class Main {
  public static void main(String[] args) {
    java.util.Scanner sc = new java.util.Scanner(System.in);
    if (sc.hasNextInt()) {
      int a = sc.nextInt();
      if (sc.hasNextInt()) {
        int b = sc.nextInt();
        System.out.println(a + b);
      }
    }
  }
}`;
    }
    if (lang === "python") {
      return `a, b = map(int, input().split())
print(a + b)`;
    }
    if (lang === "cpp") {
      return `#include <iostream>
using namespace std;
int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`;
    }
    return "";
  };

useEffect(() => {
  // ❌ If editing saved file → don't override
  if (currentCodeId) return;

  const key = `autosave_${language}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    setCode(saved);
  } else {
    setCode(getDefaultCode(language));
  }

  setCustomInput("");
  setOutput("");
  setResults([]);

}, [language, currentCodeId]);

  const addTestCase = useCallback(() => {
    setTestCases(prev => [...prev, { input: "", expectedOutput: "" }]);
  }, []);

  const removeTestCase = useCallback((index) => {
    setTestCases(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateTestCase = useCallback((index, field, value) => {
    setTestCases(prev => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  }, []);

  const runCode = useCallback(async () => {
    if (!customInput.trim()) {
      setOutput("ℹ️ Please enter input in Custom Input field");
      return;
    }
    setLoading(true);
    try {
      setMode("run");
      setResults([]);
      const payload = {
        code,
        language,
        testCases: [{ input: customInput, expectedOutput: "" }]
      };
      const res = await API.post("/run/run", payload);
      
      const result = res.data.results?.[0];
      setOutput(result?.output || "");
      setResults(res.data.results || []);
      setActiveTab("console");
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      err.message || 'Unknown error occurred';
      setOutput(`❌ ${errorMsg}`);
      setActiveTab("console");
    } finally {
      setLoading(false);
    }
  }, [code, language, customInput]);

  const submitCode = useCallback(async () => {
    const invalidCases = testCases.filter(tc => 
      !tc.input?.trim() || !tc.expectedOutput?.trim()
    );
    if (invalidCases.length > 0) {
      alert(`Please fill ${invalidCases.length} test case(s)`);
      return;
    }

    setLoading(true);
    try {
      setMode("submit");
      const res = await API.post("/run/run", { code, language, testCases });
      setResults(res.data.results || []);
      setActiveTab("results");
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      err.message || 'Unknown error occurred';
      setResults([{ 
        testNumber: 1, 
        status: "Error", 
        output: errorMsg,
        input: "N/A"
      }]);
      setActiveTab("results");
    } finally {
      setLoading(false);
    }
  }, [code, language, testCases]);

  const saveCodeToDB = async () => {
  if (!title.trim()) {
    alert("Please enter a title");
    return;
  }

  try {
    await API.post("/code/save", {
      title,
      language,
      code
    });

    alert("✅ Code saved successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Error saving code");
  }
};

  const getEditorLanguage = () => {
    const map = {
      java: "java",
      python: "python",
      cpp: "cpp"
    };
    return map[language] || "java";
  };

  const getButtonStyle = (isActive, isDisabled) => ({
    padding: "10px 20px",
    backgroundColor: isDisabled ? "#4b5563" : (isActive ? "#1e40af" : "#6b7280"),
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: isDisabled ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.6 : 1
  });

  return (
    <>
      {/* 🔥 PERFECT FIXED HEADER */}
      <header style={darkThemeStyles.header}>
        <div style={darkThemeStyles.headerContent}>
          <div style={darkThemeStyles.headerLeft}>
            <h1 style={darkThemeStyles.headerH1}>🚀 AI Code Analyzer</h1>
          </div>
          <div style={darkThemeStyles.headerRight}>
            <button 
              style={darkThemeStyles.navBtn} 
              onClick={() => navigate("/dashboard")}
            >
              🏠 Home
            </button>
            <button 
              style={darkThemeStyles.navBtn} 
              onClick={() => navigate("/analyzer")}
            >
              🔍 Analyze
            </button>
            <button 
              style={{...darkThemeStyles.navBtn, ...darkThemeStyles.navBtnHighlight}} 
              onClick={() => navigate("/history")}
            >
              📚 History
            </button>
            <button 
              style={darkThemeStyles.navBtn} 
              onClick={() => navigate("/saved-codes")}
            >
              📂 Saved Codes
            </button>
            <button 
              style={{...darkThemeStyles.navBtn, ...darkThemeStyles.logoutBtn}} 
              onClick={logout}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div style={darkThemeStyles.container}>
        {/* LEFT SIDE */}
        <div style={darkThemeStyles.leftSide}>
          <h2 style={darkThemeStyles.h2}>⚡ Online Compiler</h2>

          {/* Language Selector */}
          <div style={{ marginBottom: "15px" }}>
            <label style={darkThemeStyles.label}>Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={darkThemeStyles.select}
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          {/* Monaco Editor */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={darkThemeStyles.label}>Title:</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter code title..."
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #4b5563",
                  backgroundColor: "#1f2937",
                  color: "#fff"
                }}
              />
            </div>
            <label style={darkThemeStyles.label}>Code Editor:</label>
            <Editor
              height="400px"
              language={getEditorLanguage()}
              value={code}
              theme="vs-dark"
              onChange={setCode}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ marginBottom: "15px", display: "flex", gap: "10px" }}>
            <button
              onClick={runCode}
              disabled={loading}
              style={getButtonStyle(mode === "run", loading)}
            >
              {loading ? "⏳ Running..." : "▶ Run Code"}
            </button>
            <button
              onClick={submitCode}
              disabled={loading}
              style={getButtonStyle(mode === "submit", loading)}
            >
              {loading ? "⏳ Testing..." : "✅ Submit Tests"}
            </button>

            <button
              onClick={saveCodeToDB}
              style={{
                padding: "10px 20px",
                background: "#9333ea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              💾 Save Code
            </button>
          </div>

          {/* Custom Input */}
          <div style={{ marginBottom: "15px" }}>
            <label style={darkThemeStyles.label}>Custom Input:</label>
            <textarea
              rows="4"
              style={darkThemeStyles.textarea}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter input for Run mode..."
            />
          </div>

          {/* Console */}
          <div>
            <label style={darkThemeStyles.label}>Console:</label>
            <div style={darkThemeStyles.console}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {output || "Run code to see output..."}
              </pre>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - TABS */}
        <div style={darkThemeStyles.rightSide}>
          {/* Tab Headers */}
          <div style={darkThemeStyles.tabHeader}>
            <button 
              onClick={() => setActiveTab("testcases")}
              style={activeTab === "testcases" ? 
                { ...darkThemeStyles.tabBtn, ...darkThemeStyles.activeTabBtn } : 
                darkThemeStyles.tabBtn
              }
            >
              📝 Test Cases
            </button>
            <button 
              onClick={() => setActiveTab("results")}
              style={activeTab === "results" ? 
                { ...darkThemeStyles.tabBtn, ...darkThemeStyles.activeTabBtn } : 
                darkThemeStyles.tabBtn
              }
            >
              ✅ Results
            </button>
            <button 
              onClick={() => setActiveTab("console")}
              style={activeTab === "console" ? 
                { ...darkThemeStyles.tabBtn, ...darkThemeStyles.activeTabBtn } : 
                darkThemeStyles.tabBtn
              }
            >
              📱 Console
            </button>
          </div>

          {/* Tab Content */}
          <div style={darkThemeStyles.tabContent}>
            {activeTab === "testcases" && (
              <>
                {testCases.map((tc, i) => (
                  <div key={i} style={darkThemeStyles.testCase}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h4 style={{ margin: 0, color: "#f1f5f9" }}>Test Case {i + 1}</h4>
                      {testCases.length > 1 && (
                        <button onClick={() => removeTestCase(i)} style={{
                          padding: "5px 10px", 
                          background: "#dc2626", 
                          color: "white",
                          border: "none", 
                          borderRadius: "4px", 
                          cursor: "pointer", 
                          fontSize: "12px"
                        }}>
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={tc.input}
                      onChange={(e) => updateTestCase(i, "input", e.target.value)}
                      placeholder="Enter test input..."
                      style={darkThemeStyles.textarea}
                    />
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                      placeholder="Enter expected output..."
                      style={darkThemeStyles.textarea}
                    />
                  </div>
                ))}
                <button onClick={addTestCase} style={{
                  width: "100%", 
                  padding: "12px", 
                  background: "#1e40af",
                  color: "white", 
                  border: "none", 
                  borderRadius: "6px", 
                  fontSize: "14px", 
                  cursor: "pointer"
                }}>
                  ➕ Add Test Case
                </button>
              </>
            )}

            {activeTab === "results" && (
              loading ? (
                <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8" }}>
                  <div style={{ fontSize: "18px", marginBottom: "10px" }}>⏳ Testing in progress...</div>
                  <div>Please wait while we run your test cases</div>
                </div>
              ) : results.length === 0 ? (
                <p style={{ textAlign: "center", color: "#64748b", marginTop: "50px" }}>
                  Run tests or submit to see results here...
                </p>
              ) : (
                results.map((res, i) => (
                  <div key={i} style={{
                    ...darkThemeStyles.resultItem,
                    backgroundColor: res.status === "Accepted" ? "#064e3b" : 
                                    res.status === "Wrong Answer" ? "#7f1d1d" :  
                                    res.status === "Compilation Error" ? "#7c2d12" : "#991b1b"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, color: "#f8fafc" }}>Test Case {res.testNumber || i + 1}</h4>
                      <span style={{
                        padding: "4px 12px", 
                        borderRadius: "20px", 
                        fontSize: "12px", 
                        fontWeight: "bold",
                        backgroundColor: res.status === "Accepted" ? "#10b981" : 
                                        res.status === "Wrong Answer" ? "#ef4444" : 
                                        res.status === "Compilation Error" ? "#f59e0b" : "#dc2626",
                        color: "white"
                      }}>
                        {res.status}
                      </span>
                    </div>
                    {res.input && (
                      <div style={{ margin: "8px 0" }}>
                        <strong style={{color: "#d1d5db"}}>Input:</strong> 
                        <pre style={{ margin: "4px 0 0 0", background: "#1e293b", padding: "8px", borderRadius: "4px", fontSize: "13px", color: "#e5e7eb" }}>
                          {res.input}
                        </pre>
                      </div>
                    )}
                    {res.expected && (
                      <div style={{ margin: "8px 0" }}>
                        <strong style={{color: "#d1d5db"}}>Expected:</strong> 
                        <pre style={{ margin: "4px 0 0 0", background: "#1e293b", padding: "8px", borderRadius: "4px", fontSize: "13px", color: "#e5e7eb" }}>
                          {res.expected}
                        </pre>
                      </div>
                    )}
                    <div style={{ margin: "8px 0" }}>
                      <strong style={{color: "#d1d5db"}}>Output:</strong> 
                      <pre style={{ margin: "4px 0 0 0", background: "#1e293b", padding: "8px", borderRadius: "4px", fontSize: "13px", color: "#e5e7eb" }}>
                        {res.output || "No output"}
                      </pre>
                      {res.status !== "Accepted" && res.explanation && (
                      <div style={{
                        marginTop: "12px",
                        padding: "12px",
                        background: "#020617",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#f87171",
                        fontSize: "13px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap"
                      }}>
                        🤖 AI Explanation:
                        <div style={{ marginTop: "6px", color: "#e2e8f0" }}>
                          {res.explanation}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === "console" && (
              <pre style={{ 
                background: "#111827", 
                color: "#10b981", 
                padding: "20px", 
                borderRadius: "8px", 
                fontSize: "14px", 
                whiteSpace: "pre-wrap", 
                height: "100%", 
                overflowY: "auto",
                border: "1px solid #374151"
              }}>
                {output || "Console output appears here..."}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* 🔥 PERFECT FOOTER */}
      <footer style={darkThemeStyles.footer}>
        <div style={darkThemeStyles.footerContent}>
          <span>⚡ AI Code Analyzer v2.0</span>
          <span>•</span>
          <span>Supports Java, Python, C++</span>
          <span>•</span>
          <span>Thursday, April 02, 2026</span>
          <span>•</span>
          <a href="/privacy" style={{ color: "#60a5fa", textDecoration: "none" }}>Privacy</a>
          <span>•</span>
          <a href="/terms" style={{ color: "#60a5fa", textDecoration: "none" }}>Terms</a>
        </div>
      </footer>
    </>
  );
}

export default CodeRunnerPage;