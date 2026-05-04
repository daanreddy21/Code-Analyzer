import { useState, useEffect, useCallback } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Editor from "@monaco-editor/react";
import { 
  FaPlay, 
  FaCheckCircle, 
  FaBug, 
  FaBrain, 
  FaPlus, 
  FaTrash, 
  FaCode, 
  FaTerminal,
  FaFileAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaTimes
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function CodeRunnerPage() {
  const navigate = useNavigate();
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
  const [prediction, setPrediction] = useState("");
  const [predictLoading, setPredictLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const editorRef = useRef(null);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  // Utility function to format AI text responses
  const formatAIText = (text, type = 'explanation') => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip code block markers
      if (line.includes('```')) continue;
      
      // Format headers with emojis
      if (line.includes('❌') || line.includes('✅') || 
          line.includes('📌') || line.includes('💡') || 
          line.includes('⚠️') || line.includes('###') ||
          line.match(/^[A-Z][a-z]+:/)) {
        let headerColor = themeColors.textPrimary;
        if (line.includes('❌')) headerColor = themeColors.danger;
        if (line.includes('✅')) headerColor = themeColors.success;
        if (line.includes('⚠️')) headerColor = themeColors.warning;
        if (line.includes('📌') || line.includes('💡')) headerColor = themeColors.info;
        
        formatted.push(
          <div key={i} style={{ 
            marginTop: i > 0 ? '16px' : '0',
            marginBottom: '8px',
            fontWeight: '700',
            color: headerColor,
            fontSize: '14px',
            borderLeft: `3px solid ${headerColor}`,
            paddingLeft: '12px'
          }}>
            {line.replace(/###/g, '').trim()}
          </div>
        );
      }
      // Format success items with checkmark
      else if (line.includes('✔') || line.includes('✅')) {
        formatted.push(
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            marginBottom: '6px',
            color: themeColors.success
          }}>
            <span>✅</span>
            <span style={{ flex: 1 }}>{line.replace(/[✔✅]/g, '').trim()}</span>
          </div>
        );
      }
      // Format error items
      else if (line.includes('❌')) {
        formatted.push(
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            marginBottom: '6px',
            color: themeColors.danger
          }}>
            <span>❌</span>
            <span style={{ flex: 1 }}>{line.replace('❌', '').trim()}</span>
          </div>
        );
      }
      // Format warning items
      else if (line.includes('⚠️')) {
        formatted.push(
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '8px', 
            marginBottom: '6px',
            color: themeColors.warning
          }}>
            <span>⚠️</span>
            <span style={{ flex: 1 }}>{line.replace('⚠️', '').trim()}</span>
          </div>
        );
      }
      // Format bullet points
      else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        formatted.push(
          <div key={i} style={{ 
            marginLeft: '20px', 
            marginBottom: '4px',
            display: 'flex',
            gap: '8px',
            color: themeColors.textSecondary
          }}>
            <span>•</span>
            <span style={{ flex: 1 }}>{line.substring(1).trim()}</span>
          </div>
        );
      }
      // Format code blocks (lines with backticks)
      else if (line.includes('`') && !line.includes('```')) {
        const formattedLine = line.replace(/`([^`]+)`/g, (match, code) => {
          return `<code style="background: ${themeColors.accentGlow}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;">${code}</code>`;
        });
        formatted.push(
          <div 
            key={i} 
            style={{ marginBottom: '6px', color: themeColors.textSecondary }}
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
      // Empty line
      else if (!line.trim()) {
        formatted.push(<div key={i} style={{ height: '8px' }} />);
      }
      // Separator lines
      else if (line.includes('---')) {
        formatted.push(<hr key={i} style={{ borderColor: themeColors.border, margin: '12px 0' }} />);
      }
      // Regular text
      else {
        formatted.push(
          <div key={i} style={{ marginBottom: '4px', lineHeight: '1.6', color: themeColors.textSecondary }}>
            {line}
          </div>
        );
      }
    }
    
    return formatted;
  };

  const showToast = (message, type = "info") => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      background: ${themeColors.cardBg};
      border: 1px solid ${type === 'success' ? themeColors.success : type === 'error' ? themeColors.danger : themeColors.warning};
      border-radius: 12px;
      color: ${themeColors.textPrimary};
      font-size: 14px;
      z-index: 1000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  // Save code to localStorage per language
  useEffect(() => {
    const key = `code_${language}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setCode(saved);
    } else {
      setCode(getDefaultCode(language));
    }
    setCustomInput("");
    setOutput("");
    setResults([]);
  }, [language]);

  useEffect(() => {
    const key = `code_${language}`;
    const timeout = setTimeout(() => {
      localStorage.setItem(key, code);
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, language]);

  // Monaco Worker Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getWorkerUrl = (moduleId, label) => {
        if (label === 'json') return '/editor.worker.js';
        if (['css', 'scss', 'less', 'html'].includes(label)) return '/html.worker.js';
        if (['typescript', 'javascript'].includes(label)) return '/ts.worker.js';
        return '/editor.worker.js';
      };
      window.MonacoEnvironment = { getWorkerUrl };
    }
  }, []);

  useEffect(() => {
    setPrediction("");
  }, [code]);

  const getDefaultCode = (lang) => {
    if (lang === "java") {
      return `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        // Read two integers and print their sum
        int a = scanner.nextInt();
        int b = scanner.nextInt();
        System.out.println(a + b);
        
        scanner.close();
    }
}`;
    }
    if (lang === "python") {
      return `# Read two integers and print their sum
a, b = map(int, input().split())
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
      showToast("Please enter input in Custom Input field", "warning");
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
      showToast("Code executed successfully", "success");
    } catch (err) {
      const errorMsg = err.response?.data?.error || 
                      err.response?.data?.message || 
                      err.message || 'Unknown error occurred';
      setOutput(`❌ ${errorMsg}`);
      setActiveTab("console");
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [code, language, customInput]);

  const submitCode = useCallback(async () => {
    const invalidCases = testCases.filter(tc => 
      !tc.input?.trim() || !tc.expectedOutput?.trim()
    );
    if (invalidCases.length > 0) {
      showToast(`Please fill ${invalidCases.length} test case(s)`, "warning");
      return;
    }

    setLoading(true);
    try {
      setMode("submit");
      const res = await API.post("/run/run", { code, language, testCases });
      setResults(res.data.results || []);
      setActiveTab("results");
      
      const passedCount = res.data.results?.filter(r => r.status === "Accepted").length || 0;
      showToast(`${passedCount}/${testCases.length} test cases passed`, "success");
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
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  }, [code, language, testCases]);

  const predictCode = async () => {
    setPredictLoading(true);
    try {
      const res = await API.post("/predict", {
        code,
        language
      });
      setPrediction(res.data.prediction);
      showToast("Prediction completed", "success");
    } catch (err) {
      showToast("Prediction failed", "error");
    } finally {
      setPredictLoading(false);
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

  // Animation styles
  const animationStyles = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes progressShimmer {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    .test-case-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    .result-item {
      transition: all 0.2s ease;
    }
    .result-item:hover {
      transform: translateX(4px);
    }
    textarea:focus, select:focus, input:focus {
      outline: none;
      border-color: ${themeColors.accent} !important;
      box-shadow: 0 0 0 2px ${themeColors.accentGlow};
    }
  `;

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: themeColors.background, 
      color: themeColors.textPrimary,
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <style>{animationStyles}</style>
      
      <main style={{ 
        paddingTop: "8px", 
        paddingBottom: "60px",
        position: 'relative',
        zIndex: 1,
        maxWidth: "1600px",
        margin: "0 auto",
        paddingLeft: "24px",
        paddingRight: "24px"
      }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            padding: '8px 20px',
            borderRadius: '40px',
            marginBottom: '20px'
          }}>
            <FaCode size={20} color="#fff" />
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>Online Compiler</span>
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #fff 0%, #5a67d8 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #5a67d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px'
          }}>
            Code Execution Environment
          </h1>
          <p style={{ color: themeColors.textSecondary, fontSize: '1rem' }}>
            Write, test, and debug your code with AI-powered insights
          </p>
        </div>

        {/* Main Content Grid */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          flexWrap: 'wrap',
          minHeight: 'calc(100vh - 200px)'
        }}>
          
          {/* LEFT SIDE - Code Editor */}
          <div style={{ 
            flex: 2, 
            minWidth: '500px',
            background: themeColors.cardBg, 
            border: `1px solid ${themeColors.border}`, 
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Editor Header */}
            <div style={{ 
              padding: '16px 20px', 
              background: themeColors.bgInner,
              borderBottom: `1px solid ${themeColors.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaCode color={themeColors.accent} size={18} />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    background: themeColors.background,
                    color: themeColors.textPrimary,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >
                  <option value="java">☕ Java</option>
                  <option value="python">🐍 Python</option>
                  <option value="cpp">⚙️ C++</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Code title (optional)..."
                  style={{
                    width: "200px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${themeColors.border}`,
                    background: themeColors.background,
                    color: themeColors.textPrimary,
                    fontSize: "13px"
                  }}
                />
              </div>
            </div>

            {/* Monaco Editor */}
            <div style={{ padding: '20px', flex: 1, position: "relative" }}>

            {/* ✅ PROGRESS BAR */}
            {progress > 0 && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "4px",
                zIndex: 10,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(
                    90deg,
                    ${themeColors.accent},
                    #00f2fe,
                    ${themeColors.accent}
                  )`,
                  backgroundSize: "200% 100%",
                  animation: "progressShimmer 2s linear infinite",
                  transition: "width 0.1s linear",
                  boxShadow: `0 0 8px ${themeColors.accent}`
                }} />
              </div>
            )}
            <Editor
              height="500px"
              language={getEditorLanguage()}
              value={code}
              theme={theme === 'dark' ? "vs-dark" : "light"}
              onChange={setCode}
              onMount={(editor) => {
                editorRef.current = editor;

                editor.onDidScrollChange(() => {
                  const scrollTop = editor.getScrollTop();
                  const scrollHeight = editor.getScrollHeight();
                  const height = editor.getLayoutInfo().height;

                  if (scrollHeight <= height) {
                    setProgress(0);
                    return;
                  }

                  const p = (scrollTop / (scrollHeight - height)) * 100;
                  setProgress(p);
                });
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                fontFamily: "'Fira Code', monospace",
                lineNumbers: "on",
                renderWhitespace: "selection"
              }}
            />
            </div>

            {/* Action Buttons */}
            <div style={{ 
              padding: '16px 20px', 
              background: themeColors.bgInner,
              borderTop: `1px solid ${themeColors.border}`,
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={runCode}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaPlay />}
                Run Code
              </button>
              <button
                onClick={submitCode}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${themeColors.success}, #16a34a)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheckCircle />}
                Submit Tests
              </button>
              <button
                onClick={predictCode}
                disabled={predictLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: `linear-gradient(135deg, ${themeColors.info}, #3182ce)`,
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: predictLoading ? 'not-allowed' : 'pointer',
                  opacity: predictLoading ? 0.6 : 1
                }}
              >
                {predictLoading ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaBrain />}
                Predict Behavior
              </button>
            </div>

            {/* AI Prediction Display - Formatted */}
            {prediction && (
              <div style={{ 
                margin: '16px 20px',
                padding: '20px',
                background: `linear-gradient(135deg, ${themeColors.accentGlow}, ${themeColors.accentGlow})`,
                border: `1px solid ${themeColors.info}`,
                borderRadius: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>🔮</span>
                  <strong style={{ color: themeColors.info, fontSize: '16px' }}>AI Behavior Prediction</strong>
                </div>
                <div style={{ color: themeColors.textSecondary }}>
                  {formatAIText(prediction, 'prediction')}
                </div>
              </div>
            )}

            {/* Custom Input */}
            <div style={{ padding: '0 20px 20px 20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '13px',
                fontWeight: '600',
                color: themeColors.textSecondary
              }}>
                <FaTerminal style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Custom Input
              </label>
              <textarea
                rows="3"
                style={{
                  width: "100%",
                  padding: "12px",
                  border: `1px solid ${themeColors.border}`,
                  borderRadius: "10px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  background: themeColors.background,
                  color: themeColors.textPrimary,
                  resize: "vertical"
                }}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter input for Run mode..."
              />
            </div>

            {/* Console Output */}
            <div style={{ padding: '0 20px 20px 20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '13px',
                fontWeight: '600',
                color: themeColors.textSecondary
              }}>
                <FaTerminal style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Console Output
              </label>
              <div style={{ 
                background: themeColors.background, 
                color: themeColors.success, 
                padding: "16px", 
                borderRadius: "10px",
                fontSize: "13px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                minHeight: "120px",
                maxHeight: "150px",
                overflowY: "auto",
                border: `1px solid ${themeColors.border}`
              }}>
                {output || "Run code to see output..."}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Test Cases & Results */}
          <div style={{ 
            flex: 1, 
            minWidth: '350px',
            background: themeColors.cardBg, 
            border: `1px solid ${themeColors.border}`, 
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Tab Headers */}
            <div style={{ 
              display: 'flex', 
              background: themeColors.bgInner,
              borderBottom: `1px solid ${themeColors.border}`,
              padding: '4px'
            }}>
              {[
                { id: "testcases", label: "Test Cases", icon: FaFileAlt },
                { id: "results", label: "Results", icon: FaCheckCircle },
                { id: "console", label: "Console", icon: FaTerminal }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: activeTab === tab.id ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` : 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    color: activeTab === tab.id ? '#fff' : themeColors.textSecondary,
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ 
              flex: 1, 
              padding: '20px', 
              overflowY: 'auto',
              maxHeight: '600px'
            }}>
              {/* Test Cases Tab */}
              {activeTab === "testcases" && (
                <div>
                  {testCases.map((tc, i) => (
                    <div 
                      key={i} 
                      className="test-case-item"
                      style={{
                        marginBottom: '16px',
                        padding: '16px',
                        background: themeColors.bgInner,
                        borderRadius: '12px',
                        border: `1px solid ${themeColors.border}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        marginBottom: "12px" 
                      }}>
                        <h4 style={{ margin: 0, color: themeColors.accent, fontSize: '14px' }}>
                          Test Case {i + 1}
                        </h4>
                        {testCases.length > 1 && (
                          <button 
                            onClick={() => removeTestCase(i)} 
                            style={{
                              padding: "6px 10px", 
                              background: 'rgba(245, 101, 101, 0.2)',
                              color: themeColors.danger,
                              border: `1px solid ${themeColors.danger}`,
                              borderRadius: "8px", 
                              cursor: "pointer", 
                              fontSize: "12px",
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FaTrash size={10} /> Remove
                          </button>
                        )}
                      </div>
                      <textarea
                        value={tc.input}
                        onChange={(e) => updateTestCase(i, "input", e.target.value)}
                        placeholder="Input..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "10px",
                          marginBottom: "10px",
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: "8px",
                          background: themeColors.background,
                          color: themeColors.textPrimary,
                          fontSize: "13px",
                          fontFamily: "monospace",
                          resize: "vertical"
                        }}
                      />
                      <textarea
                        value={tc.expectedOutput}
                        onChange={(e) => updateTestCase(i, "expectedOutput", e.target.value)}
                        placeholder="Expected Output..."
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: "8px",
                          background: themeColors.background,
                          color: themeColors.textPrimary,
                          fontSize: "13px",
                          fontFamily: "monospace",
                          resize: "vertical"
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={addTestCase} 
                    style={{
                      width: "100%", 
                      padding: "12px", 
                      background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                      color: "white", 
                      border: "none", 
                      borderRadius: "10px", 
                      fontSize: "14px", 
                      fontWeight: "600",
                      cursor: "pointer",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaPlus size={14} /> Add Test Case
                  </button>
                </div>
              )}

              {/* Results Tab */}
              {activeTab === "results" && (
                loading ? (
                  <div style={{ textAlign: "center", padding: "60px 20px" }}>
                    <FaSpinner size={40} style={{ animation: 'spin 1s linear infinite', color: themeColors.accent, marginBottom: '16px' }} />
                    <div style={{ color: themeColors.textSecondary }}>Testing in progress...</div>
                  </div>
                ) : results.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: themeColors.textSecondary }}>
                    <FaCode size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Run tests to see results here</p>
                  </div>
                ) : (
                  results.map((res, i) => (
                    <div 
                      key={i} 
                      className="result-item"
                      style={{
                        marginBottom: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: res.status === "Accepted" ? 'rgba(72, 187, 120, 0.1)' : 
                                    res.status === "Wrong Answer" ? 'rgba(245, 101, 101, 0.1)' : 
                                    'rgba(237, 137, 54, 0.1)',
                        border: `1px solid ${res.status === "Accepted" ? themeColors.success : 
                                          res.status === "Wrong Answer" ? themeColors.danger : themeColors.warning}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <h4 style={{ margin: 0, color: themeColors.textPrimary, fontSize: '14px' }}>
                          Test Case {res.testNumber || i + 1}
                        </h4>
                        <span style={{
                          padding: "4px 12px", 
                          borderRadius: "20px", 
                          fontSize: "11px", 
                          fontWeight: "bold",
                          background: res.status === "Accepted" ? themeColors.success : 
                                      res.status === "Wrong Answer" ? themeColors.danger : themeColors.warning,
                          color: "white",
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {res.status === "Accepted" ? <FaCheck size={10} /> : <FaTimes size={10} />}
                          {res.status}
                        </span>
                      </div>
                      
                      {res.input && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong style={{ color: themeColors.textSecondary, fontSize: '12px' }}>Input:</strong>
                          <pre style={{ 
                            margin: "4px 0 0 0", 
                            background: themeColors.background, 
                            padding: "8px", 
                            borderRadius: "6px", 
                            fontSize: "12px", 
                            fontFamily: "monospace",
                            color: themeColors.textPrimary
                          }}>
                            {res.input}
                          </pre>
                        </div>
                      )}
                      
                      {res.expected && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong style={{ color: themeColors.textSecondary, fontSize: '12px' }}>Expected:</strong>
                          <pre style={{ 
                            margin: "4px 0 0 0", 
                            background: themeColors.background, 
                            padding: "8px", 
                            borderRadius: "6px", 
                            fontSize: "12px", 
                            fontFamily: "monospace",
                            color: themeColors.textPrimary
                          }}>
                            {res.expected}
                          </pre>
                        </div>
                      )}
                      
                      <div style={{ marginBottom: "10px" }}>
                        <strong style={{ color: themeColors.textSecondary, fontSize: '12px' }}>Output:</strong>
                        <pre style={{ 
                          margin: "4px 0 0 0", 
                          background: themeColors.background, 
                          padding: "8px", 
                          borderRadius: "6px", 
                          fontSize: "12px", 
                          fontFamily: "monospace",
                          color: res.status === "Accepted" ? themeColors.success : themeColors.danger
                        }}>
                          {res.output || "No output"}
                        </pre>
                      </div>
                      
                      {/* AI Explanation - Formatted */}
                      {res.status !== "Accepted" && res.explanation && (
                        <div style={{
                          marginTop: "12px",
                          padding: "16px",
                          background: themeColors.accentGlow,
                          border: `1px solid ${themeColors.info}`,
                          borderRadius: "12px"
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '20px' }}>🤖</span>
                            <strong style={{ color: themeColors.info }}>AI Explanation</strong>
                          </div>
                          <div style={{ color: themeColors.textSecondary }}>
                            {formatAIText(res.explanation, 'explanation')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}

              {/* Console Tab */}
              {activeTab === "console" && (
                <pre style={{ 
                  background: themeColors.background, 
                  color: themeColors.success, 
                  padding: "16px", 
                  borderRadius: "10px", 
                  fontSize: "13px", 
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap", 
                  minHeight: "400px",
                  overflowY: "auto",
                  border: `1px solid ${themeColors.border}`
                }}>
                  {output || "Console output appears here..."}
                </pre>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CodeRunnerPage;