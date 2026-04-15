import { useEffect, useState, useMemo } from "react";
import { diffLines } from "diff";
import Editor from "@monaco-editor/react";
import { useNavigate } from "react-router-dom";

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

   const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // ✅ SINGLE getLanguage function (fixed duplicate)
  const getLanguage = (fileName) => {
    if (!fileName) return "javascript";
    if (fileName.endsWith(".java")) return "java";
    if (fileName.endsWith(".py")) return "python";
    if (fileName.endsWith(".js") || fileName.endsWith(".jsx")) return "javascript";
    if (fileName.endsWith(".cpp") || fileName.endsWith(".c")) return "cpp";
    return "javascript";
  };

  // ✅ File validation helper
  const getValidFileExtensions = () => ({
    javascript: ['.js', '.jsx'],
    java: ['.java'],
    python: ['.py'],
    "c++": ['.cpp', '.c']
  });

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
    } else {
      setFile2(id); setCode2(data.code); setFileName2(name);
    }
  };

  // ✅ IMPROVED handleUpload with validation
  const handleUpload = async (e, side) => {
    const file = e.target.files[0];
    
    if (!file) return alert("❌ No file selected");
    
    // ✅ VALIDATION 1: Check language selected
    if (!language) {
      alert("⚠️ Please select a language first from the dropdown!");
      return;
    }
    
    // ✅ VALIDATION 2: Check file extension
    const validExts = getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')] || [];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExts.includes(fileExt)) {
      alert(`❌ Invalid file type for ${language}!\nAllowed: ${validExts.join(', ')}`);
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
      alert(`✅ ${side.toUpperCase()} ${language} file uploaded & loaded`);
    } catch (err) {
      alert(`❌ Upload failed: ${err.message}`);
    }
  };

  const saveLeftFile = async () => {
    if (!file1) return alert("Select left file");
    await fetch(`http://localhost:5000/api/files/${file1}`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ code: code1 }),
    });
    alert("✅ Left file saved");
  };

  const saveRightFile = async () => {
    if (!file2) return alert("Select right file");
    await fetch(`http://localhost:5000/api/files/${file2}`, {
      method: "PUT",
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify({ code: code2 }),
    });
    alert("✅ Right file saved");
  };

  const copyLeftToRight = () => setCode2(code1);
  const copyRightToLeft = () => setCode1(code2);

  const downloadFile = (code, fileName) => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "code.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔥 FETCH VERSIONS FUNCTION
const fetchVersions = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/code/all-versions", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    // 🔥 FIX: ensure it's array
    if (!Array.isArray(data)) {
      console.error("Invalid response:", data);
      alert(data.error || "Failed to load versions");
      return;
    }

    setVersions(data);

    if (data.length > 0 && data[0].versions.length > 0) {
      setSelectedVersion(data[0].versions[0]);
    }

    setShowVersions(true);

  } catch (err) {
    alert("Failed to load versions");
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

  // --- STYLES ---
  const containerStyle = {
    minHeight: "100vh",
    paddingTop: "100px",
    background: "#0e1d4b",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    flexDirection: "column"
  };

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2rem",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    maxWidth: "1250px",
    margin: "0 auto 40px auto",
    width: "95%"
  };

  const btnPrimary = {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "0.2s"
  };

  return (
    <div style={containerStyle}>
      <style>{`
        .dashboard-header { 
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000; 
          padding: 12px 0; background: rgba(10, 15, 30, 0.85); 
          backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
        }
        .header-content { 
          max-width: 1200px; margin: 0 auto; padding: 0 24px; 
          display: flex; justify-content: space-between; align-items: center; 
        }
        .nav-btn { 
          background: transparent; color: #cbd5e0; border: none; 
          padding: 8px 16px; border-radius: 8px; font-weight: 600; 
          cursor: pointer; transition: 0.2s; 
        }
        .nav-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .nav-btn.highlight { background: linear-gradient(135deg, #00c6ff, #0072ff); color: white; }
        .dashboard-footer { 
          background: #222736; border-top: 1px solid rgba(255,255,255,0.1); 
          padding: 50px 0 20px 0; margin-top: auto; 
        }
        .footer-content { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .footer-main { 
          display: flex; justify-content: space-between; flex-wrap: wrap; 
          gap: 40px; margin-bottom: 40px; 
        }
        .footer-links { display: flex; gap: 60px; }
        .footer-links div { display: flex; flex-direction: column; gap: 10px; }
        .footer-links a { color: #94a3b8; text-decoration: none; font-size: 14px; }
        .footer-links a:hover { color: #00c6ff; }
        .line-added { background: rgba(0, 255, 0, 0.15); }
        .line-removed { background: rgba(255, 0, 0, 0.15); }
        .line-common { background: transparent; }
        input[type="file"] { color: #94a3b8; font-size: 14px; }
        select { 
          background: #1a202c; color: white; border: 1px solid #4a5568; 
          padding: 8px; border-radius: 6px; 
        }
      `}</style>

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 style={{fontSize: "20px", margin: 0}}>🚀 AI Code Analyzer</h1>
          </div>
          <div className="header-right">
            <button className="nav-btn" onClick={() => navigate("/dashboard")}>Home</button>
            <button className="nav-btn" onClick={() => navigate("/analyzer")}>Analyze</button>
            <button className="nav-btn highlight" onClick={() => navigate("/history")}>History</button>
            <button className="nav-btn" onClick={logout} style={{color: '#ff4d4d'}}>Logout</button>
          </div>
        </div>
      </header>

<div style={cardStyle}>

  {showVersions ? (

    // ================= VERSION HISTORY UI =================
    <>
      <button
        style={{ ...btnPrimary, marginBottom: "15px", background: "#64748b" }}
        onClick={() => setShowVersions(false)}
      >
        ⬅ Back to Compare
      </button>

      <div style={{ display: "flex", gap: "20px" }}>

        {/* LEFT SIDE */}
        <div style={{
          width: "250px",
          background: "rgba(255,255,255,0.03)",
          padding: "20px",
          borderRadius: "12px"
        }}>
          <h4>📜 Versions</h4>
          
          {versions.length === 0 && (
  <p style={{ color: "#94a3b8" }}>No versions available</p>
)}

{versions.map((file, i) => (
  <div key={i} style={{ marginBottom: "20px" }}>

    {/* FILE NAME */}
    <h4 style={{ color: "#00c6ff" }}>
      📄 {file.file_name}
    </h4>

    {/* VERSIONS */}
    {file.versions.map((v, index) => (
      <div key={index} style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px",
        marginBottom: "5px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "6px"
      }}>
        <span>Version {v.version}</span>

        <button
          style={{ ...btnPrimary, padding: "5px 10px", fontSize: "12px" }}
          onClick={() => setSelectedVersion(v)}
        >
          View
        </button>
      </div>
    ))}

  </div>
))}
        </div>

        {/* RIGHT SIDE */}
        <div style={{ flex: 1 }}>
          {selectedVersion ? (
            <Editor
              height="500px"
              theme="vs-dark"
              language={getLanguage(selectedVersion.file_name)}
              value={selectedVersion.code}
              options={{ readOnly: true }}
            />
          ) : (
            <p>No version selected</p>
          )}
        </div>

      </div>
    </>

  ) : (

    // ================= YOUR EXISTING UI =================
    <>
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
  <button
    style={{ ...btnPrimary, background: "#f59e0b" }}
    onClick={() => {
      

      fetchVersions();
    }}
  >
    📜 Version History
  </button>
</div>

        {/* ✅ Upload & Select Grid - FULLY VALIDATED */}
        <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px'}}>
          <div style={{flex: 1, minWidth: '300px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px'}}>
            <h4>📤 Upload & Select</h4>
            <div style={{display: 'flex', gap: '0px', marginBottom: '15px'}}>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#94a3b8'}}>Left File</label>
                <input 
                  type="file" 
                  accept={language ? getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')]?.join(',') : ''} 
                  onChange={(e) => handleUpload(e, "left")} 
                />
              </div>
              <div>
                <label style={{display: 'block', fontSize: '12px', color: '#94a3b8'}}>Right File</label>
                <input 
                  type="file" 
                  accept={language ? getValidFileExtensions()[language.toLowerCase().replace('++', 'pp')]?.join(',') : ''} 
                  onChange={(e) => handleUpload(e, "right")} 
                />
              </div>
            </div>
            <select style={{width: '100%', padding: '8px', borderRadius: '5px'}} onChange={(e) => setLanguage(e.target.value)}>
              <option value="">🚫 Select Language FIRST</option>
              <option value="JavaScript">JavaScript (.js, .jsx)</option>
              <option value="Java">Java (.java)</option>
              <option value="Python">Python (.py)</option>
              <option value="C++">C++ (.cpp, .c)</option>
            </select>
            {language && (
              <p style={{fontSize: '12px', color: '#4CAF50', marginTop: '5px'}}>
                ✅ Ready for {language} files
              </p>
            )}
          </div>

          <div style={{flex: 1.5, minWidth: '300px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', maxHeight: '200px', overflowY: 'auto'}}>
            <h4>📂 Saved Files</h4>
            {files.map((file) => (
              <div key={file.id} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'}}>
                <span style={{fontSize: '14px'}}>{file.file_name} <span style={{color: '#94a3b8', fontSize: '12px'}}>({file.language})</span></span>
                <div style={{display: 'flex', gap: '5px'}}>
                  <button style={{fontSize: '11px', padding: '2px 8px'}} onClick={() => loadFile(file.id, "left", file.file_name)}>Left</button>
                  <button style={{fontSize: '11px', padding: '2px 8px'}} onClick={() => loadFile(file.id, "right", file.file_name)}>Right</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Area */}
        {code1 && code2 && (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
              <h5 style={{color: '#00c6ff'}}>📄 Left: {fileName1}</h5>
              <h5 style={{color: '#00c6ff'}}>📄 Right: {fileName2}</h5>
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
              <div style={{flex: 1}}>
                <Editor 
                  height="450px" 
                  theme="vs-dark" 
                  language={getLanguage(fileName1)} 
                  value={code1} 
                  onMount={(editor) => setLeftEditor(editor)} 
                  onChange={(value) => setCode1(value || "")} 
                />
              </div>
              <div style={{flex: 1}}>
                <Editor 
                  height="450px" 
                  theme="vs-dark" 
                  language={getLanguage(fileName2)} 
                  value={code2} 
                  onMount={(editor) => setRightEditor(editor)} 
                  onChange={(value) => setCode2(value || "")} 
                />
              </div>
            </div>

            {/* Action Toolbar */}
            <div style={{display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0'}}>
              <button style={btnPrimary} onClick={saveLeftFile}>💾 Save Left</button>
              <button style={btnPrimary} onClick={saveRightFile}>💾 Save Right</button>
              <button style={{...btnPrimary, background: '#4a5568'}} onClick={copyLeftToRight}>➡ Copy L to R</button>
              <button style={{...btnPrimary, background: '#4a5568'}} onClick={copyRightToLeft}>⬅ Copy R to L</button>
              <button style={{...btnPrimary, background: '#22c55e'}} onClick={() => downloadFile(code1, fileName1)}>⬇ DL Left</button>
              <button style={{...btnPrimary, background: '#22c55e'}} onClick={() => downloadFile(code2, fileName2)}>⬇ DL Right</button>
            </div>

            {/* Diff Summary */}
            <div style={{background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                <span style={{color: '#22c55e'}}>🟢 Added: {addedCount}</span>
                <span style={{color: '#ff4d4d'}}>🔴 Removed: {removedCount}</span>
              </div>
              <div style={{maxHeight: '200px', overflowY: 'auto', fontSize: '13px', background: '#1a202c', padding: '15px', borderRadius: '10px'}}>
                {differences.map((part, i) => (
                  <pre key={i} style={{ 
                    margin: 0, padding: '2px 0', whiteSpace: 'pre-wrap', 
                    color: part.added ? '#22c55e' : part.removed ? '#ff4d4d' : '#94a3b8', 
                    background: part.added ? 'rgba(34, 197, 94, 0.1)' : part.removed ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
                  }}>
                    {part.added ? '+ ' : part.removed ? '- ' : '  '}{part.value}
                  </pre>
                ))}
              </div>
            </div>
          </>
        )}
            </>
  )}

</div>
      

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <h3>🚀 AI Code Analyzer</h3>
              <p>The industry standard for AI-powered code auditing and comparison.</p>
            </div>
            <div className="footer-links">
              <div><h4>Product</h4><a href="/analyzer">Analyze</a><a href="/history">History</a></div>
              <div><h4>Company</h4><a href="#">About</a><a href="#">Support</a></div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 AI Code Analyzer • Developed for Developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CodeCompare;
