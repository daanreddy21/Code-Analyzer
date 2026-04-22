import { useEffect, useState, useMemo } from "react";
import { diffLines } from "diff";
import Editor from "@monaco-editor/react";
import { useNavigate } from "react-router-dom";
import { 
  FaCode, 
  FaExchangeAlt, 
  FaSave, 
  FaDownload, 
  FaCopy, 
  FaHistory, 
  FaArrowLeft,
  FaFileUpload,
  FaFileAlt,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function CodeCompare() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [fileName1, setFileName1] = useState("");
  const [fileName2, setFileName2] = useState("");
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [leftEditor, setLeftEditor] = useState(null);
  const [rightEditor, setRightEditor] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedFileVersions, setSelectedFileVersions] = useState(null);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const getLanguage = (fileName) => {
    if (!fileName) return "javascript";
    if (fileName.endsWith(".java")) return "java";
    if (fileName.endsWith(".py")) return "python";
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".cpp") || fileName.endsWith(".c")) return "cpp";
    return "javascript";
  };

  const getValidFileExtensions = () => ({
    javascript: ['.js', '.jsx'],
    java: ['.java'],
    python: ['.py'],
    "c++": ['.cpp', '.c']
  });

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

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`http://localhost:5000/api/files?language=${language}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFiles(data);
    } catch (err) {
      console.error("Fetch Error:", err.message);
      showToast("Failed to load files", "error");
    }
  };

  useEffect(() => { fetchFiles(); }, [language, page]);

  const loadFile = async (id, side, name) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/api/files/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (side === "left") {
      setFile1(id); setCode1(data.code); setFileName1(name);
      showToast(`Loaded "${name}" on left`, "success");
    } else {
      setFile2(id); setCode2(data.code); setFileName2(name);
      showToast(`Loaded "${name}" on right`, "success");
    }
  };

  const handleUpload = async (e, side) => {
    const file = e.target.files[0];
    
    if (!file) return showToast("No file selected", "warning");
    
    if (!language) {
      showToast("Please select a language first!", "warning");
      return;
    }
    
    const validExts = getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')] || [];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExts.includes(fileExt)) {
      showToast(`Invalid file type for ${language}!\nAllowed: ${validExts.join(', ')}`, "error");
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      const data = await res.json();
      if (side === "left") {
        setFile1(data.id); setCode1(data.code); setFileName1(data.file_name);
      } else {
        setFile2(data.id); setCode2(data.code); setFileName2(data.file_name);
      }
      fetchFiles();
      showToast(`${side.toUpperCase()} ${language} file uploaded & loaded`, "success");
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, "error");
    }
  };

  const saveFile = async (side) => {
    const fileId = side === "left" ? file1 : file2;
    const code = side === "left" ? code1 : code2;
    const fileName = side === "left" ? fileName1 : fileName2;
    
    if (!fileId) return showToast(`No ${side} file selected`, "warning");
    
    try {
      await fetch(`http://localhost:5000/api/files/${fileId}`, {
        method: "PUT",
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ code }),
      });
      showToast(`✅ ${fileName} saved successfully`, "success");
    } catch (err) {
      showToast(`Failed to save ${fileName}`, "error");
    }
  };

  const copyLeftToRight = () => {
    setCode2(code1);
    showToast("Copied left → right", "success");
  };
  
  const copyRightToLeft = () => {
    setCode1(code2);
    showToast("Copied right → left", "success");
  };

  const downloadFile = (code, fileName) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${fileName}`, "success");
  };

  const fetchVersions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/code/all-versions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        console.error("Invalid response:", data);
        showToast(data.error || "Failed to load versions", "error");
        return;
      }
      
      setVersions(data);
      if (data.length > 0 && data[0].versions.length > 0) {
        setSelectedVersion(data[0].versions[0]);
        setSelectedFileVersions(data[0]);
      }
      setShowVersions(true);
    } catch (err) {
      showToast("Failed to load versions", "error");
    }
  };

  const getLineDecorations = (editor, differences, isLeft) => {
    if (!editor || !window.monaco) return [];
    const decorations = [];
    let leftLine = 1; let rightLine = 1;
    differences.forEach((part) => {
      const lines = part.value.split("\n").length - 1;
      for (let i = 0; i < lines; i++) {
        if (part.added) {
          if (!isLeft) decorations.push({ 
            range: new window.monaco.Range(rightLine, 1, rightLine, 1), 
            options: { isWholeLine: true, className: "line-added" } 
          });
          rightLine++;
        } else if (part.removed) {
          if (isLeft) decorations.push({ 
            range: new window.monaco.Range(leftLine, 1, leftLine, 1), 
            options: { isWholeLine: true, className: "line-removed" } 
          });
          leftLine++;
        } else {
          decorations.push({ 
            range: new window.monaco.Range(isLeft ? leftLine : rightLine, 1, isLeft ? leftLine : rightLine, 1), 
            options: { isWholeLine: true, className: "line-common" } 
          });
          leftLine++; rightLine++;
        }
      }
    });
    return decorations;
  };

  const differences = useMemo(() => diffLines(code1, code2), [code1, code2]);

  useEffect(() => {
    if (leftEditor && rightEditor && window.monaco) {
      const leftDecorations = getLineDecorations(leftEditor, differences, true);
      const rightDecorations = getLineDecorations(rightEditor, differences, false);
      leftEditor.deltaDecorations([], leftDecorations);
      rightEditor.deltaDecorations([], rightDecorations);
    }
  }, [differences, leftEditor, rightEditor]);

  const addedCount = differences.filter((d) => d.added).length;
  const removedCount = differences.filter((d) => d.removed).length;

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
    .line-added { background: rgba(72, 187, 120, 0.15); }
    .line-removed { background: rgba(245, 101, 101, 0.15); }
    .line-common { background: transparent; }
    .file-item:hover { background: ${themeColors.accentGlow}; transform: translateX(4px); }
    .version-item:hover { background: ${themeColors.accentGlow}; }
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
        paddingTop: "100px", 
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
            <FaExchangeAlt size={20} color="#fff" />
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>Code Comparison Tool</span>
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
            Smart Code Comparator
          </h1>
          <p style={{ color: themeColors.textSecondary, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Compare, merge, and track changes between code versions with visual diff highlighting
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
          
          {showVersions ? (
            // ================= VERSION HISTORY UI =================
            <>
              <button
                onClick={() => setShowVersions(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: themeColors.accentGlow,
                  border: `1px solid ${themeColors.accent}`,
                  borderRadius: '10px',
                  color: themeColors.accent,
                  cursor: 'pointer',
                  marginBottom: '24px',
                  fontWeight: '500'
                }}
              >
                <FaArrowLeft size={14} /> Back to Compare
              </button>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {/* Left Sidebar - File List */}
                <div style={{
                  width: "300px",
                  background: themeColors.bgInner,
                  padding: "20px",
                  borderRadius: "16px",
                  border: `1px solid ${themeColors.border}`
                }}>
                  <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                    <FaHistory color={themeColors.accent} /> Version History
                  </h4>
                  
                  {versions.length === 0 ? (
                    <p style={{ color: themeColors.textSecondary, textAlign: 'center', padding: '40px 0' }}>
                      No versions available
                    </p>
                  ) : (
                    versions.map((file, i) => (
                      <div key={i} style={{ marginBottom: '24px' }}>
                        <div style={{ 
                          padding: '12px', 
                          background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                          borderRadius: '10px',
                          marginBottom: '12px'
                        }}>
                          <FaFileAlt style={{ marginRight: '8px', color: '#fff' }} />
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#fff' }}>{file.file_name}</span>
                        </div>
                        
                        {file.versions.map((v, index) => (
                          <div 
                            key={index} 
                            className="version-item"
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "10px 12px",
                              marginBottom: "8px",
                              background: selectedVersion?.id === v.id ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` : themeColors.bgInner,
                              borderRadius: "10px",
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => {
                              setSelectedVersion(v);
                              setSelectedFileVersions(file);
                            }}
                          >
                            <span style={{ fontSize: '13px', color: selectedVersion?.id === v.id ? '#fff' : themeColors.textPrimary }}>
                              Version {v.version}
                            </span>
                            <span style={{ 
                              fontSize: '11px', 
                              color: selectedVersion?.id === v.id ? '#fff' : themeColors.textSecondary,
                              fontFamily: 'monospace'
                            }}>
                              {new Date(v.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>

                {/* Right Side - Code Viewer */}
                <div style={{ flex: 1 }}>
                  {selectedVersion ? (
                    <div>
                      <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px',
                        background: themeColors.accentGlow,
                        borderRadius: '10px',
                        border: `1px solid ${themeColors.accent}`
                      }}>
                        <strong style={{ color: themeColors.textPrimary }}>{selectedFileVersions?.file_name}</strong>
                        <span style={{ color: themeColors.textSecondary, marginLeft: '12px' }}>
                          Version {selectedVersion.version}
                        </span>
                      </div>
                      <Editor
                        height="600px"
                        theme={theme === 'dark' ? "vs-dark" : "light"}
                        language={getLanguage(selectedVersion.file_name)}
                        value={selectedVersion.code}
                        options={{ readOnly: true, fontSize: 13 }}
                      />
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '100px 20px',
                      background: themeColors.bgInner,
                      borderRadius: '16px'
                    }}>
                      <FaCode size={48} color={themeColors.textSecondary} />
                      <p style={{ color: themeColors.textSecondary, marginTop: '16px' }}>Select a version to view</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            // ================= MAIN COMPARE UI =================
            <>
              {/* Upload & Select Section */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '24px', 
                marginBottom: '32px' 
              }}>
                {/* Upload Panel */}
                <div style={{ 
                  background: themeColors.bgInner, 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${themeColors.border}`
                }}>
                  <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                    <FaFileUpload color={themeColors.accent} /> Upload Files
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: themeColors.textSecondary, display: 'block', marginBottom: '8px' }}>Left File</label>
                      <input 
                        type="file" 
                        accept={language ? getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')]?.join(',') : ''} 
                        onChange={(e) => handleUpload(e, "left")}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          background: themeColors.background,
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: '8px',
                          color: themeColors.textPrimary,
                          fontSize: '12px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: themeColors.textSecondary, display: 'block', marginBottom: '8px' }}>Right File</label>
                      <input 
                        type="file" 
                        accept={language ? getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')]?.join(',') : ''} 
                        onChange={(e) => handleUpload(e, "right")}
                        style={{ 
                          width: '100%', 
                          padding: '8px', 
                          background: themeColors.background,
                          border: `1px solid ${themeColors.border}`,
                          borderRadius: '8px',
                          color: themeColors.textPrimary,
                          fontSize: '12px'
                        }}
                      />
                    </div>
                  </div>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: themeColors.background,
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '8px',
                      color: themeColors.textPrimary,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select Language First</option>
                    <option value="JavaScript">JavaScript (.js, .jsx)</option>
                    <option value="Java">Java (.java)</option>
                    <option value="Python">Python (.py)</option>
                    <option value="C++">C++ (.cpp, .c)</option>
                  </select>
                  {language && (
                    <p style={{ fontSize: '12px', color: themeColors.success, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FaCheckCircle size={12} /> Ready for {language} files
                    </p>
                  )}
                </div>

                {/* Saved Files Panel */}
                <div style={{ 
                  background: themeColors.bgInner, 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${themeColors.border}`,
                  maxHeight: '280px',
                  overflowY: 'auto'
                }}>
                  <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                    <FaFileAlt color={themeColors.success} /> Saved Files
                  </h4>
                  {files.map((file) => (
                    <div 
                      key={file.id} 
                      className="file-item"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px',
                        marginBottom: '8px',
                        background: themeColors.background,
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: themeColors.textPrimary }}>{file.file_name}</span>
                        <span style={{ color: themeColors.textSecondary, fontSize: '11px', marginLeft: '8px' }}>({file.language})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => loadFile(file.id, "left", file.file_name)}
                          style={{
                            padding: '4px 12px',
                            background: themeColors.accentGlow,
                            border: `1px solid ${themeColors.accent}`,
                            borderRadius: '6px',
                            color: themeColors.accent,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Left
                        </button>
                        <button 
                          onClick={() => loadFile(file.id, "right", file.file_name)}
                          style={{
                            padding: '4px 12px',
                            background: themeColors.accentGlow,
                            border: `1px solid ${themeColors.accent}`,
                            borderRadius: '6px',
                            color: themeColors.accent,
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  ))}
                  {files.length === 0 && (
                    <p style={{ textAlign: 'center', color: themeColors.textSecondary, padding: '40px 0' }}>
                      No saved files yet
                    </p>
                  )}
                </div>

                {/* Version History Button */}
                <div style={{ 
                  background: themeColors.bgInner, 
                  padding: '20px', 
                  borderRadius: '16px',
                  border: `1px solid ${themeColors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={fetchVersions}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 24px',
                      background: `linear-gradient(135deg, ${themeColors.warning}, #d97706)`,
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <FaHistory size={18} /> View Version History
                  </button>
                </div>
              </div>

              {/* Comparison Area - Only show when both files are loaded */}
              {code1 && code2 && (
                <>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '12px',
                    background: themeColors.accentGlow,
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaFileAlt color={themeColors.accent} />
                      <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>Left: {fileName1}</span>
                    </div>
                    <FaExchangeAlt color={themeColors.textSecondary} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FaFileAlt color={themeColors.accent} />
                      <span style={{ fontWeight: '600', color: themeColors.textPrimary }}>Right: {fileName2}</span>
                    </div>
                  </div>

                  {/* Monaco Editors */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <Editor 
                        height="500px" 
                        theme={theme === 'dark' ? "vs-dark" : "light"} 
                        language={getLanguage(fileName1)} 
                        value={code1} 
                        onMount={(editor) => setLeftEditor(editor)} 
                        onChange={(value) => setCode1(value || "")} 
                        options={{ fontSize: 13, fontFamily: "'Fira Code', monospace" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Editor 
                        height="500px" 
                        theme={theme === 'dark' ? "vs-dark" : "light"} 
                        language={getLanguage(fileName2)} 
                        value={code2} 
                        onMount={(editor) => setRightEditor(editor)} 
                        onChange={(value) => setCode2(value || "")} 
                        options={{ fontSize: 13, fontFamily: "'Fira Code', monospace" }}
                      />
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    margin: '24px 0',
                    flexWrap: 'wrap'
                  }}>
                    <button onClick={() => saveFile("left")} style={buttonStyle(themeColors, 'primary')}>
                      <FaSave size={14} /> Save Left
                    </button>
                    <button onClick={() => saveFile("right")} style={buttonStyle(themeColors, 'primary')}>
                      <FaSave size={14} /> Save Right
                    </button>
                    <button onClick={copyLeftToRight} style={buttonStyle(themeColors, 'secondary')}>
                      <FaCopy size={14} /> Copy L → R
                    </button>
                    <button onClick={copyRightToLeft} style={buttonStyle(themeColors, 'secondary')}>
                      <FaCopy size={14} /> Copy R → L
                    </button>
                    <button onClick={() => downloadFile(code1, fileName1)} style={buttonStyle(themeColors, 'success')}>
                      <FaDownload size={14} /> DL Left
                    </button>
                    <button onClick={() => downloadFile(code2, fileName2)} style={buttonStyle(themeColors, 'success')}>
                      <FaDownload size={14} /> DL Right
                    </button>
                  </div>

                  {/* Diff Summary */}
                  <div style={{ 
                    background: themeColors.bgInner, 
                    padding: '20px', 
                    borderRadius: '16px',
                    border: `1px solid ${themeColors.border}`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: '16px',
                      paddingBottom: '12px',
                      borderBottom: `1px solid ${themeColors.border}`
                    }}>
                      <span style={{ color: themeColors.success, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaPlus /> Added: {addedCount} lines
                      </span>
                      <span style={{ color: themeColors.danger, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaMinus /> Removed: {removedCount} lines
                      </span>
                    </div>
                    
                    {/* Diff Viewer */}
                    <div style={{ 
                      maxHeight: '300px', 
                      overflowY: 'auto', 
                      fontSize: '13px', 
                      background: themeColors.background, 
                      padding: '16px', 
                      borderRadius: '12px',
                      fontFamily: "'Fira Code', monospace"
                    }}>
                      {differences.map((part, i) => (
                        <pre key={i} style={{ 
                          margin: 0, 
                          padding: '4px 8px', 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: 'inherit',
                          fontSize: '12px',
                          color: part.added ? themeColors.success : part.removed ? themeColors.danger : themeColors.textSecondary, 
                          background: part.added ? 'rgba(72, 187, 120, 0.1)' : part.removed ? 'rgba(245, 101, 101, 0.1)' : 'transparent',
                          borderLeft: part.added ? `3px solid ${themeColors.success}` : part.removed ? `3px solid ${themeColors.danger}` : 'none'
                        }}>
                          {part.added ? '+ ' : part.removed ? '- ' : '  '}{part.value}
                        </pre>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Empty State - No files loaded */}
              {(!code1 || !code2) && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '80px 20px',
                  background: themeColors.bgInner,
                  borderRadius: '16px'
                }}>
                  <FaCode size={64} color={themeColors.textSecondary} style={{ marginBottom: '20px', opacity: 0.5 }} />
                  <h3 style={{ marginBottom: '8px', color: themeColors.textPrimary }}>No files loaded</h3>
                  <p style={{ color: themeColors.textSecondary }}>
                    Upload files or select from saved files to start comparing
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function for button styles
const buttonStyle = (themeColors, type) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  background: type === 'primary' ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` :
              type === 'success' ? `linear-gradient(135deg, ${themeColors.success}, #16a34a)` :
              themeColors.accentGlow,
  border: type === 'secondary' ? `1px solid ${themeColors.accent}` : 'none',
  borderRadius: '10px',
  color: type === 'secondary' ? themeColors.accent : '#fff',
  cursor: 'pointer',
  fontWeight: '500',
  transition: 'transform 0.2s'
});

export default CodeCompare;