import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { FaCode, FaUpload, FaPlay, FaFileAlt, FaCheckCircle, FaExclamationTriangle, FaLanguage, FaKeyboard, FaFolderOpen } from "react-icons/fa";
import Footer from "../components/Footer";
import { useTheme } from "../context/ThemeContext";

function Analyzer() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("");
  const [pasteCode, setPasteCode] = useState("");
  const [fileCode, setFileCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("paste"); 
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  
  const { themeColors, theme } = useTheme();
  
const analyzeCodeLocally = (code, language) => {
  let score = 100;
  let issues = [];

  const addIssue = (type, title, suggestion, penalty) => {
    issues.push({ type, title, suggestion });
    score -= penalty;
  };

  const lines = code.split("\n").filter(l => l.trim()).length;

  // ================= JAVASCRIPT =================
  if (language === "JavaScript") {

    if (/eval\s*\(/i.test(code)) {
      addIssue("CRITICAL", "Use of eval()", "Avoid eval() due to injection risk", 30);
    }

    if (/Function\s*\(/i.test(code)) {
      addIssue("CRITICAL", "Dynamic Function()", "Avoid dynamic code execution", 25);
    }

    if (/innerHTML\s*=/.test(code)) {
      addIssue("HIGH", "innerHTML usage", "Use textContent to prevent XSS", 20);
    }

    if (/\b==\b/.test(code)) {
      addIssue("MEDIUM", "Loose equality (==)", "Use === instead", 10);
    }

    if (/\b!=\b/.test(code)) {
      addIssue("MEDIUM", "Loose inequality (!=)", "Use !== instead", 10);
    }

    if (/var\s+/.test(code)) {
      addIssue("LOW", "var usage", "Use let/const", 8);
    }

    if (/console\.log/.test(code)) {
      addIssue("LOW", "Debug logs", "Remove console.log in production", 5);
    }

    if (!/;\s*$/.test(code.trim()) && lines < 50) {
      addIssue("LOW", "Missing semicolon", "Add semicolons", 5);
    }

    if (/document\.write/.test(code)) {
      addIssue("HIGH", "document.write usage", "Avoid document.write()", 20);
    }

    if (/setTimeout\s*\(\s*".*"\)/.test(code)) {
      addIssue("HIGH", "String in setTimeout", "Use function instead of string", 15);
    }
  }

  // ================= PYTHON =================
  if (language === "Python") {

    if (/eval\s*\(/.test(code) || /exec\s*\(/.test(code)) {
      addIssue("CRITICAL", "eval/exec usage", "Use safer parsing methods", 35);
    }

    if (/print\s*\(/.test(code)) {
      addIssue("LOW", "Print statements", "Use logging module", 5);
    }

    if (/except\s*:/i.test(code)) {
      addIssue("HIGH", "Generic exception", "Specify exception type", 20);
    }

    if (/global\s+/.test(code)) {
      addIssue("MEDIUM", "Global variable", "Avoid global variables", 10);
    }

    if (/==\s*None/.test(code)) {
      addIssue("LOW", "None comparison", "Use 'is None'", 5);
    }

    if (!/:$/.test(code.split("\n").find(l => l.includes("if")) || "")) {
      addIssue("MEDIUM", "Missing colon", "Python requires ':'", 10);
    }

    if (/\t/.test(code)) {
      addIssue("LOW", "Tabs used", "Use spaces instead of tabs", 5);
    }
  }

  // ================= JAVA =================
  if (language === "Java") {

    if (/catch\s*\(\s*Exception/.test(code)) {
      addIssue("CRITICAL", "Generic Exception", "Catch specific exceptions", 25);
    }

    if (/System\.out\.println/.test(code)) {
      addIssue("LOW", "Debug print", "Use logging framework", 5);
    }

    if (/public\s+static\s+void\s+main/.test(code) === false) {
      addIssue("MEDIUM", "No main method", "Add main method", 10);
    }

    if (/==\s*true|==\s*false/.test(code)) {
      addIssue("LOW", "Boolean comparison", "Avoid == true/false", 5);
    }

    if (/String\s+\w+\s*=\s*".*"\s*\+/.test(code)) {
      addIssue("MEDIUM", "String concatenation", "Use StringBuilder", 10);
    }

    if (/new\s+Integer/.test(code)) {
      addIssue("LOW", "Wrapper class usage", "Use autoboxing", 5);
    }
  }

  // ================= C++ =================
  if (language === "C++") {

    if (/gets\s*\(/.test(code)) {
      addIssue("CRITICAL", "Unsafe gets()", "Use fgets instead", 30);
    }

    if (/scanf\s*\(.*%s/.test(code)) {
      addIssue("HIGH", "Unsafe scanf", "Use width limit in scanf", 20);
    }

    if (/malloc\s*\(/.test(code) && !/free\s*\(/.test(code)) {
      addIssue("HIGH", "Memory leak risk", "Free allocated memory", 20);
    }

    if (/using\s+namespace\s+std/.test(code)) {
      addIssue("LOW", "Namespace pollution", "Avoid using namespace std", 5);
    }

    if (/cout\s*<<.*<<\s*endl/.test(code)) {
      addIssue("LOW", "endl usage", "Use '\\n' instead of endl", 5);
    }

    if (!/#include/.test(code)) {
      addIssue("MEDIUM", "Missing include", "Add required headers", 10);
    }

    if (/int\s+main\s*\(\)/.test(code) === false) {
      addIssue("MEDIUM", "No main function", "Add main()", 10);
    }
  }

  // ================= COMMON RULES =================

  if (lines > 300) {
    addIssue("MEDIUM", "Large file", "Split into smaller modules", 15);
  }

  if (code.length < 30) {
    addIssue("LOW", "Too short", "Write meaningful code", 10);
  }

  if (/password\s*=/.test(code)) {
    addIssue("CRITICAL", "Hardcoded password", "Use environment variables", 35);
  }

  if (/SELECT.*\+/.test(code)) {
    addIssue("CRITICAL", "SQL Injection risk", "Use parameterized queries", 30);
  }

  return {
    score: Math.max(0, score),
    issues
  };
};

const submitCode = async () => {
  setShowPopup(false);
  if (!language) {
    showToast("Select language", "warning");
    return;
  }

  if (!pasteCode.trim()) {
    showToast("Code empty", "warning");
    return;
  }

  setIsAnalyzing(true);

  try {
    // 🔥 ANALYZE LOCALLY
    const result = analyzeCodeLocally(pasteCode, language);

    setAnalysisResult(result);

    // ❌ SHOW POPUP ONLY IF < 60
if (result.score < 60) {
  setShowPopup(true);
  setIsAnalyzing(false); // ✅ ADD THIS
  return;
}

    // ✅ NORMAL FLOW (SAVE TO BACKEND)
    try {
      await API.post("/code/paste", { language, code: pasteCode });
      showToast("Code submitted successfully!", "success");

    } catch (err) {
      if (err.response?.data?.error) {
        showToast(err.response.data.error, "error");
      } else {
        showToast("Error", "error");
      }
      return;
    }

    setPasteCode("");
    setLanguage("");

  } catch (err) {
    showToast("Error", "error");
  } finally {
    setIsAnalyzing(false);
  }
};

const uploadFile = async () => {
  if (!language || !fileName) {
    showToast("Select language & file", "warning");
    return;
  }

  if (!fileCode.trim()) {
    showToast("Empty file", "warning");
    return;
  }

  setIsAnalyzing(true);

  try {
    // 🔥 ANALYZE LOCALLY
    const result = analyzeCodeLocally(fileCode, language);

    setAnalysisResult(result);

    if (result.score < 60) {
      setShowPopup(true);
      setIsAnalyzing(false); // ✅ ADD THIS
      return;
    }

    // ✅ NORMAL UPLOAD
    const formData = new FormData();
    formData.append("language", language);

    const blob = new Blob([fileCode], { type: "text/plain" });
    const fileObj = new File([blob], fileName);

    formData.append("file", fileObj);
    formData.append("code", fileCode);

      try {
        const res = await API.post("/code/upload", formData);

        showToast("File uploaded successfully!", "success");

      } catch (err) {
        if (err.response?.data?.error) {
          showToast(err.response.data.error, "error"); // ✅ duplicate file msg
        } else {
          showToast("Upload failed", "error");
        }
        return;
      }

    setFileName("");
    setFileCode("");
    setLanguage("");

  } catch (err) {
    showToast("Upload error", "error");
  } finally {
    setIsAnalyzing(false);
  }
};
// ✅ VALIDATE FILE EXTENSION WITH LANGUAGE
const validateFileWithLanguage = (fileName, language) => {
  const ext = "." + fileName.split(".").pop().toLowerCase();

  const map = {
    Java: ".java",
    Python: ".py",
    JavaScript: ".js",
    "C++": ".cpp",
  };

  return map[language] === ext;
};

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "warning");
      return;
    }
    
    // Validate file type
    if (!language) {
      showToast("Please select language first", "warning");
      return;
    }

    if (!validateFileWithLanguage(selectedFile.name, language)) {
      showToast("Invalid file type for selected language", "error");
      return;
    }
    setFileName(selectedFile.name);
    setFileCode("");
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileCode(event.target.result);
    };
    reader.onerror = () => {
      showToast("Error reading file", "error");
    };
    reader.readAsText(selectedFile);
  };

  // Toast notification system using themeColors
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

  // Add animation styles
  const animationStyles = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .analyzer-textarea:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px ${themeColors.accentGlow};
    }
    .analyzer-select:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 3px ${themeColors.accentGlow};
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
      
      {/* Main Content */}
      <main style={{ 
        paddingTop: "50px", 
        paddingBottom: "60px",
        position: 'relative',
        zIndex: 1,
        maxWidth: "1400px",
        margin: "0 auto",
        paddingLeft: "24px",
        paddingRight: "24px"
      }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>AI-Powered Analysis</span>
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '700', 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #fff 0%, #5a67d8 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #5a67d8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            Code Analysis Studio
          </h1>
          <p style={{ color: themeColors.textSecondary, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Paste your code or upload a file to get instant AI-powered insights, bug detection, and quality scores
          </p>
        </div>

        {/* Main Card */}
        <div style={{ 
          background: themeColors.cardBg, 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: '24px', 
          padding: '32px',
          backdropFilter: 'blur(10px)',
          marginBottom: '40px'
        }}>
          
          {/* Language Selector */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '12px', 
              color: themeColors.textSecondary, 
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              <FaLanguage style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Select Programming Language
            </label>
<select 
  onChange={(e) => setLanguage(e.target.value)}
  value={language}
  className="analyzer-select"
  style={{
    padding: "14px 20px",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "300px",
    background: themeColors.inputBg,  // ✅ CHANGE THIS
    color: themeColors.textPrimary,
    border: `1px solid ${themeColors.border}`,
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }}
>
              <option value="">Choose language...</option>
              <option value="Java">☕ Java</option>
              <option value="Python">🐍 Python</option>
              <option value="JavaScript">📜 JavaScript</option>
              <option value="C++">⚙️ C++</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '24px',
            borderBottom: `1px solid ${themeColors.border}`,
            paddingBottom: '12px'
          }}>
            <button
              onClick={() => setActiveTab("paste")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: activeTab === "paste" ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: activeTab === "paste" ? '#fff' : themeColors.textSecondary,
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaKeyboard size={14} />
              Paste Code
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: activeTab === "upload" ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` : 'transparent',
                border: 'none',
                borderRadius: '10px',
                color: activeTab === "upload" ? '#fff' : themeColors.textSecondary,
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaFolderOpen size={14} />
              Upload File
            </button>
          </div>

          {/* Paste Code Tab */}
          {activeTab === "paste" && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{ 
                background: themeColors.bgInner, 
                borderRadius: '16px', 
                padding: '20px',
                border: `1px solid ${themeColors.border}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                    <FaCode color={themeColors.accent} />
                    Code Editor
                  </h3>
                  {pasteCode && (
                    <span style={{ 
                      fontSize: '12px', 
                      color: themeColors.success,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <FaCheckCircle size={12} />
                      {pasteCode.split('\n').length} lines
                    </span>
                  )}
                </div>

<textarea
  className="analyzer-textarea"
  placeholder="// Paste your code here for instant analysis..."
  value={pasteCode}
  onChange={(e) => setPasteCode(e.target.value)}
  style={{
    width: "100%",
    minHeight: "400px",
    padding: "16px",
    borderRadius: "12px",
    background: themeColors.inputBg,  // ✅ CHANGE THIS (was themeColors.background)
    color: themeColors.textPrimary,
    border: `1px solid ${themeColors.border}`,
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "13px",
    resize: "vertical",
    lineHeight: "1.5"
  }}
/>


                <button 
                  onClick={submitCode} 
                  disabled={isAnalyzing || !language || !pasteCode.trim()}
                  style={{
                    padding: "14px 28px",
                    background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: (isAnalyzing || !language || !pasteCode.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: "600",
                    marginTop: "20px",
                    width: "100%",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: (isAnalyzing || !language || !pasteCode.trim()) ? 0.6 : 1
                  }}
                >
                  {isAnalyzing ? (
                    <>⏳ Analyzing...</>
                  ) : (
                    <><FaPlay size={14} /> upload & analyze</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Upload File Tab */}
          {activeTab === "upload" && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{ 
                background: themeColors.bgInner, 
                borderRadius: '16px', 
                padding: '20px',
                border: `1px solid ${themeColors.border}`
              }}>
                <div style={{ 
                  border: `2px dashed ${themeColors.border}`,
                  borderRadius: "16px",
                  padding: "48px",
                  textAlign: 'center',
                  position: 'relative',
                  background: themeColors.accentGlow,
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}>
                  <FaUpload size={48} color={themeColors.accent} style={{ marginBottom: '16px', opacity: 0.7 }} />
                  <p style={{ color: themeColors.textSecondary, marginBottom: '8px' }}>
                    {fileName ? `📄 ${fileName}` : "Drag & drop your file here or click to browse"}
                  </p>
                  <p style={{ color: themeColors.textSecondary, fontSize: '12px' }}>
                    Supported formats: .js, .py, .java, .cpp, .txt (Max 5MB)
                  </p>
                  <input 
                    type="file" 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      opacity: 0,
                      width: '100%',
                      height: '100%',
                      cursor: 'pointer'
                    }}
                    onChange={handleFileChange}
                    accept=".js,.py,.java,.cpp,.txt"
                  />
                </div>
                
                {fileCode && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                        <FaFileAlt color={themeColors.success} />
                        File Preview
                      </h3>
                      <span style={{ 
                        fontSize: '12px', 
                        color: themeColors.textSecondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <FaCheckCircle size={12} color={themeColors.success} />
                        Loaded successfully
                      </span>
                    </div>
<textarea 
  value={fileCode} 
  onChange={(e) => setFileCode(e.target.value)}
  className="analyzer-textarea"
  style={{
    width: "100%",
    minHeight: "250px",
    padding: "16px",
    borderRadius: "12px",
    background: themeColors.inputBg,  // ✅ CHANGE THIS
    color: themeColors.textPrimary,
    border: `1px solid ${themeColors.border}`,
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "13px",
    resize: "vertical",
    lineHeight: "1.5"
  }}
/>
                  </div>
                )}
                
                <button 
                  onClick={uploadFile} 
                  disabled={isAnalyzing || !fileName || !fileCode.trim()}
                  style={{
                    padding: "14px 28px",
                    background: `linear-gradient(135deg, ${themeColors.success}, #16a34a)`,
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: (isAnalyzing || !fileName || !fileCode.trim()) ? 'not-allowed' : 'pointer',
                    fontWeight: "600",
                    marginTop: "20px",
                    width: "100%",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    opacity: (isAnalyzing || !fileName || !fileCode.trim()) ? 0.6 : 1
                  }}
                >
                  {isAnalyzing ? (
                    <>⏳ Uploading & Analyzing...</>
                  ) : (
                    <><FaUpload size={14} /> Upload & Analyze</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '24px',
          marginTop: '40px'
        }}>
          <div style={{ 
            background: themeColors.cardBg, 
            border: `1px solid ${themeColors.border}`, 
            borderRadius: '16px', 
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <h4 style={{ marginBottom: '8px', color: themeColors.textPrimary }}>Bug Detection</h4>
            <p style={{ color: themeColors.textSecondary, fontSize: '14px' }}>Identify potential bugs and security vulnerabilities</p>
          </div>
          <div style={{ 
            background: themeColors.cardBg, 
            border: `1px solid ${themeColors.border}`, 
            borderRadius: '16px', 
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
            <h4 style={{ marginBottom: '8px', color: themeColors.textPrimary }}>Quality Score</h4>
            <p style={{ color: themeColors.textSecondary, fontSize: '14px' }}>Get instant quality metrics and improvement suggestions</p>
          </div>
          <div style={{ 
            background: themeColors.cardBg, 
            border: `1px solid ${themeColors.border}`, 
            borderRadius: '16px', 
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
            <h4 style={{ marginBottom: '8px', color: themeColors.textPrimary }}>AI Suggestions</h4>
            <p style={{ color: themeColors.textSecondary, fontSize: '14px' }}>Receive AI-powered recommendations for code improvement</p>
          </div>
        </div>
        {showPopup && analysisResult && (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  }}>
    <div style={{
      background: "#1f2937",
      padding: "24px",
      borderRadius: "16px",
      width: "400px",
      color: "#fff"
    }}>
      <h2>
        {analysisResult.score < 50
          ? "🔴 Code Rejected"
          : "🟡 Needs Improvement"}
      </h2>

      <p>Score: {analysisResult.score}</p>
      <p>Bugs: {analysisResult.issues.length}</p>

      <ul>
        {analysisResult.issues.map((issue, i) => (
          <li key={i}>
            <b>{issue.title}</b><br/>
            💡 {issue.suggestion}
          </li>
        ))}
      </ul>

      <button
        onClick={() => setShowPopup(false)}
        style={{
          marginTop: "15px",
          padding: "10px",
          width: "100%",
          background: "#6366f1",
          border: "none",
          color: "#fff",
          borderRadius: "8px"
        }}
      >
        Close
      </button>
    </div>
  </div>
)}
      </main>

      
    </div>
  );
}

export default Analyzer;
