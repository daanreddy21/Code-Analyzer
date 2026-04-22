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
  const [activeTab, setActiveTab] = useState("paste"); // 'paste' or 'upload'
  
  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const submitCode = async () => {
    if (!language) { 
      showToast("Please select a programming language", "warning"); 
      return; 
    }
    if (!pasteCode.trim()) { 
      showToast("Code cannot be empty", "warning"); 
      return; 
    }
    
    setIsAnalyzing(true);
    try {
      await API.post("/code/paste", { language, code: pasteCode });
      showToast("Code analyzed successfully!", "success");
      setPasteCode("");
      setLanguage("");
    } catch (err) {
      showToast(err.response?.data?.error || "Error analyzing code", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadFile = async () => {
    if (!language || !fileName) { 
      showToast("Please select language and file", "warning"); 
      return; 
    }
    if (!fileCode.trim()) { 
      showToast("File content is empty", "warning"); 
      return; 
    }
    
    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("language", language);
    
    const fileBlob = new Blob([fileCode], { type: 'text/plain' });
    const fileObj = new File([fileBlob], fileName, { type: 'text/plain' });
    formData.append("file", fileObj);
    formData.append("code", fileCode);
    
    try {
      const response = await API.post("/code/upload", formData);
      showToast(`File "${response.data.fileName}" analyzed successfully!`, "success");
      setFileName("");
      setFileCode("");
      setLanguage("");
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      showToast('Upload failed: ' + (err.response?.data?.error || err.message), "error");
    } finally {
      setIsAnalyzing(false);
    }
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
    const validExtensions = ['.js', '.py', '.java', '.cpp', '.txt'];
    const fileExt = '.' + selectedFile.name.split('.').pop();
    if (!validExtensions.includes(fileExt)) {
      showToast("Unsupported file type. Please use .js, .py, .java, .cpp, or .txt", "warning");
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
// For the paste code textarea (around line 220)
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
                    <><FaPlay size={14} /> Analyze Code</>
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
      </main>

      
    </div>
  );
}

export default Analyzer;
