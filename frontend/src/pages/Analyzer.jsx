import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Header from "../components/Header"; 
import Footer from "../components/Footer";

function Analyzer() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [language, setLanguage] = useState("");
  const [pasteCode, setPasteCode] = useState("");
  const [fileCode, setFileCode] = useState("");
  const [fileName, setFileName] = useState("");  // ✅ FIXED: filename only

   const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const submitCode = async () => {
    if (!language) { alert("⚠️ Please select a language"); return; }
    if (!pasteCode.trim()) { alert("⚠️ Code cannot be empty"); return; }
    try {
      await API.post("/code/paste", { language, code: pasteCode });
      alert("✅ Code saved successfully");
      setPasteCode("");
    } catch (err) {
      alert(err.response?.data?.error || "❌ Error saving code");
    }
  };

  // 🔥 PERFECTLY FIXED UPLOAD
  const uploadFile = async () => {
    if (!language || !fileName) { 
      alert("⚠️ Please select language and file"); 
      return; 
    }
    if (!fileCode.trim()) { 
      alert("⚠️ File content is empty"); 
      return; 
    }
    
    const formData = new FormData();
    formData.append("language", language);
    
    // ✅ Create File object from content + filename
    const fileBlob = new Blob([fileCode], { type: 'text/plain' });
    const fileObj = new File([fileBlob], fileName, { type: 'text/plain' });
    formData.append("file", fileObj);  // ✅ Multer gets this!
    formData.append("code", fileCode);
    
    console.log('✅ Uploading:', { language, fileName, codeLength: fileCode.length });
    
    try {
      const response = await API.post("/code/upload", formData);
      alert("✅ File uploaded: " + response.data.fileName);
      // Reset form
      setFileName("");
      setFileCode("");
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // 🔥 FIXED: Store filename only, not full File object
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    console.log('📁 Selected:', selectedFile.name, selectedFile.size);
    setFileName(selectedFile.name);  // ✅ Just filename
    setFileCode("");  // Clear first
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileCode(event.target.result);
      console.log('✅ File loaded:', event.target.result.length, 'chars');
    };
    reader.readAsText(selectedFile);
  };

  // --- STYLES (unchanged) ---
  const containerStyle = {
    minHeight: "100vh",
    paddingTop: "120px", 
    fontFamily: "'Inter', sans-serif",
    background: "#101f4c", 
    color: "#fff",
    display: "flex",
    flexDirection: "column",
  };

  const cardStyle = {
    background: "rgba(12, 10, 78, 0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    maxWidth: "1100px",
    margin: "0 auto 80px auto",
    width: "90%",
  };

  const sideBySideWrapper = {
    display: "flex",
    gap: "2rem",
    flexWrap: "wrap",
    marginTop: "2rem"
  };

  const columnStyle = {
    flex: "1",
    minWidth: "320px",
    background: "rgba(255, 255, 255, 0.03)",
    padding: "1.8rem",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)"
  };

  const textareaStyle = {
    width: "100%",
    minHeight: "300px",
    padding: "1rem",
    borderRadius: "12px",
    background: "#1a202c",
    color: "#e2e8f0",
    border: "1px solid #4a5568",
    fontFamily: "'Fira Code', monospace",
    marginTop: "12px",
    fontSize: "14px",
    resize: "vertical"
  };

  const btnPrimary = {
    padding: "14px 24px",
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    marginTop: "1.5rem",
    width: "100%",
    transition: "transform 0.2s"
  };

  return (
    <div style={containerStyle}>

{/* 🔥 FIXED HEADER */}
<Header
          navigate={navigate}
          unreadCount={unreadCount}
          unread={unread}
          logout={logout}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          setShowProjectModal={setShowProjectModal}
          setShowMessages={setShowMessages}
        />




      <div style={cardStyle}>
        <h2 style={{textAlign: 'center', marginBottom: '30px', fontSize: '28px'}}>🎯 Code Analysis Studio</h2>
        
        <div style={{textAlign: 'center', marginBottom: '1rem'}}>
          <label style={{display: 'block', marginBottom: '10px', color: '#94a3b8'}}>Step 1: Choose Language</label>
          <select 
            onChange={(e)=>setLanguage(e.target.value)}
            value={language}
            style={{padding: "12px 20px", borderRadius: "10px", width: "280px", background: '#1a202c', color: 'white', border: '1px solid #4a5568'}}
          >
            <option value="">Select Language...</option>
            <option value="Java">Java</option>
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="C++">C++</option>
          </select>
        </div>

        <div style={sideBySideWrapper}>
          <div style={columnStyle}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>💻 Paste Code</h3>
            <textarea
              placeholder="// Paste your code here..."
              value={pasteCode}
              onChange={(e)=>setPasteCode(e.target.value)}
              style={textareaStyle}
            />
            <button onClick={submitCode} style={btnPrimary}>Analyze Snippet</button>
          </div>

          <div style={columnStyle}>
            <h3 style={{display: 'flex', alignItems: 'center', gap: '10px'}}>📁 Upload File</h3>
            <div style={{border: "2px dashed #4a5568", padding: "2.5rem", borderRadius: "12px", textAlign: 'center', position: 'relative', background: 'rgba(255,255,255,0.02)'}}>
              <p style={{color: '#94a3b8'}}>
                {fileName ? `✅ ${fileName}` : "Drag & Drop or Click to Upload"}
              </p>
              <input 
                type="file" 
                style={{position: 'absolute', top:0, left:0, opacity:0, width:'100%', height:'100%', cursor:'pointer'}}
                onChange={handleFileChange}  // ✅ FIXED handler
              />
            </div>
            {fileCode && (
              <textarea 
                value={fileCode} 
                onChange={(e) => setFileCode(e.target.value)}
                style={{...textareaStyle, minHeight: "150px", borderColor: '#22c55e'}}
              />
            )}
            <button 
              onClick={uploadFile} 
              style={{...btnPrimary, background: "linear-gradient(135deg, #22c55e, #16a34a)"}}
              disabled={!fileName || !fileCode.trim()}  // ✅ Prevent empty uploads
            >
              Upload & Analyze
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 FIXED FOOTER */}
      <Footer />
    </div>
  );
}

export default Analyzer;
