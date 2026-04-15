import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RewardCard from "../components/RewardCard";
import { io } from "socket.io-client";

function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [languageFilter, setLanguageFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const itemsPerPage = 5;
  // --- ADD THIS HERE ---
  const [projectAnalysis, setProjectAnalysis] = useState(null);
  const [isAnalyzingProject, setIsAnalyzingProject] = useState(false);

  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState([]);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const socket = useMemo(() => io("http://localhost:5000"), []);


  useEffect(() => {
  socket.on("new_comment", (comment) => {
    setComments((prev) => [...prev, comment]);
  });

  return () => socket.off("new_comment");
}, []);
  

 const viewProjectAnalysis = (project) => {
  console.log("Analyze clicked for project:", project.title);

  // Use the backend‑generated data directly
  setProjectAnalysis({
    ...project,
    // If issues are stored as JSON string in DB
    issues: typeof project.issues === "string"
      ? JSON.parse(project.issues)
      : project.issues || [],
    score: project.score || 0
  });

  // Remove the hardcoded setTimeout fake issues
};
  // ----------------------

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
  if (analysisResult) {
    console.log("analysisResult.issues:", analysisResult.issues);
  }
}, [analysisResult]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [codeRes, projectRes] = await Promise.all([
        API.get("/code/history"),
        API.get("/projects/my-submissions")
      ]);
      setHistory(codeRes.data);
      setProjects(projectRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeleted = async () => {
  try {
    const res = await API.get("/code/deleted");
    setDeletedFiles(res.data);
  } catch (err) {
    console.error("Fetch deleted failed:", err);
  }
};

const undoDelete = async (original_id) => {
  if (!window.confirm("Restore this file?")) return;
  try {
    await API.post(`/code/deleted/${original_id}/undo`);
    alert("✅ Restored!");
    fetchDeleted();
    fetchData();  // Refresh main list
  } catch (err) {
    alert("Undo failed");
  }
};

  const handleDownload = useCallback(async (projectId, title) => {
    try {
      const response = await API.get(`/projects/download/${projectId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'project'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Unauthorized or file not found.");
    }
  }, []);

   const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };


  const deleteCode = useCallback(async (id) => {
    if (!window.confirm("Delete this submission?")) return;
    try {
      await API.delete(`/code/${id}`);
      fetchData();
    } catch (err) { 
      alert("Delete failed"); 
    }
  }, []);

  const deleteProject = useCallback(async (id) => {
  if (!window.confirm("Are you sure you want to delete this project?")) return;
  try {
    await API.delete(`/projects/${id}`);
    alert("Project deleted successfully");
    fetchData();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete project");
  }
}, []);

 // Add this state inside your History component
const [editMode, setEditMode] = useState(false);
const [editedCode, setEditedCode] = useState("");

// Update your viewCode function
const viewCode = useCallback(async (id) => {
  try {
    const res = await API.get(`/code/${id}`);

    socket.emit("join_submission", id); // ✅ ADDED HERE

    setSelectedCode({...res.data, id: id }); 
    setEditedCode(res.data.code);
    setEditMode(false);

    // 🔥 ADD THIS
    const commentRes = await API.get(`/comments/${id}`);
    setComments(commentRes.data);

  } catch (err) { 
    alert("Failed to load code"); 
  }
}, []);

// 🔥 NEW: COMMENT FUNCTION
const addComment = async () => {
  if (!newComment.trim()) return;
  console.log("Sending submissionId:", selectedCode.id);

  try {
    await API.post("/comments", {
      submissionId: selectedCode.id,
      comment: newComment
      
    });
    console.log("Sending ID:", selectedCode.id);

    setNewComment("");

    // 🔁 refresh comments
    const res = await API.get(`/comments/${selectedCode.id}`);
    setComments(res.data);

  } catch (err) {
    alert("Failed to add comment");
  }
};

// 🔥 NEW: SAVE EDITED CODE FUNCTION
const handleSave = async () => {
  try {
    // Ensure selectedCode.id is present
    await API.put(`/code/${selectedCode.id}`, {
      code: editedCode,
      language: selectedCode.language,
      file_name: selectedCode.file_name
    });
    alert("✅ Code updated and resubmitted!");
    setSelectedCode(null);
    fetchData(); 
  } catch (err) {
    console.error("Update failed:", err.response?.data || err.message);
    alert("Update failed: " + (err.response?.data?.error || "Unknown error"))
  }
};

  const analyzeCode = useCallback(async (id) => {
    try {
      setIsAnalyzing(true);
      setAnalysisResult(null); // Clear previous results
      const res = await API.get(`/code/analyze/${id}`);
      setAnalysisResult(res.data);
    } catch (err) { 
      console.error("Analysis failed:", err);
      alert("Analysis failed: " + (err.response?.data?.error || err.message));
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const downloadFile = useCallback(async (id) => {
    try {
      const res = await API.get(`/code/${id}`);
      const blob = new Blob([res.data.code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.data.file_name || "code.txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { 
      alert("Download failed"); 
    }
  }, []);

 const exportReport = useCallback(() => {
  if (!analysisResult) return;
  const report = `Code Analysis Report\nScore: ${analysisResult.score}/100\n\nIssues:\n${analysisResult.issuesDisplay?.join('\n') || analysisResult.issues?.join('\n') || 'No issues found'}`;
  const blob = new Blob([report], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${Date.now()}.txt`;
  a.click();
}, [analysisResult]);

const copyIssues = useCallback(() => {
  if (!analysisResult) return;
  const issuesText = analysisResult.issuesDisplay?.join('\n') || 
                    analysisResult.issues?.map(i => i.title || i).join('\n') || 
                    'No issues found';
  navigator.clipboard.writeText(issuesText).then(() => {
    alert('Issues copied to clipboard!');
  });
}, [analysisResult]);

  const filteredHistory = useMemo(() => 
    history.filter(item => !languageFilter || item.language === languageFilter),
    [history, languageFilter]
  );

  const totalPages = useMemo(() => 
    Math.ceil(filteredHistory.length / itemsPerPage),
    [filteredHistory.length]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  // --- STYLES ---
  const containerStyle = {
    minHeight: "100vh",
    paddingTop: "120px",
    paddingBottom: "100px",
    fontFamily: "'Inter', sans-serif",
    background: "#0a0f1e",
    color: "#fff"
  };
  
  const cardStyle = {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "2.5rem",
    boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    maxWidth: "1150px",
    margin: "0 auto 40px auto",
    width: "90%"
  };
  
  const thStyle = {
    padding: "20px 24px",
    textAlign: "left",
    fontWeight: "700",
    color: "#94a3b8",
    borderBottom: "3px solid rgba(255,255,255,0.1)"
  };
  
  const tdStyle = {
    padding: "24px",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0"
  };
  
  const btnPrimary = {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600"
  };
  
  const actionBtn = (bgColor) => ({
    padding: "10px 20px",
    background: bgColor,
    color: "white",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    marginRight: "12px"
  });

  if (loading) {
    return (
      <div style={{ 
        ...containerStyle, 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <h2>Loading history...</h2>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes modalScaleIn { 
          from { transform: scale(0.9); opacity: 0; } 
          to { transform: scale(1); opacity: 1; } 
        }
          @keyframes spin { 
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); } 
          }
        .dashboard-header { 
          position: fixed; 
          top: 0; left: 0; right: 0; 
          z-index: 1000; 
          padding: 14px 0; 
          background: rgba(10, 15, 30, 0.85); 
          backdrop-filter: blur(12px); 
          border-bottom: 1px solid rgba(255, 255, 255, 0.1); 
        }
        .header-content { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 24px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
        }
        .nav-btn { 
          background: transparent; 
          color: #cbd5e0; 
          border: none; 
          padding: 8px 16px; 
          border-radius: 8px; 
          font-weight: 600; 
          cursor: pointer; 
        }
        .nav-btn.highlight { 
          background: linear-gradient(135deg, #00c6ff, #0072ff); 
          color: white; 
        }
        .dashboard-footer { 
          background: #070b14; 
          border-top: 1px solid rgba(255,255,255,0.1); 
          padding: 40px 0; 
          text-align: center; 
          color: #94a3b8; 
        }
      `}</style>

      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🚀 AI Code Analyzer</h1>
          </div>
          <div className="header-right">
            <button className="nav-btn" onClick={() => navigate("/dashboard")}>Home</button>
            <button className="nav-btn" onClick={() => navigate("/analyzer")}>Analyze</button>
            <button className="nav-btn highlight" onClick={() => navigate("/history")}>History</button>
            <button className="nav-btn logout" onClick={logout} style={{color: '#ff4d4d'}}>Logout</button>
          </div>
        </div>
      </header>

      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'2rem'}}>
  <h2>📋 Submission History</h2>
  <div style={{display:'flex', gap:'10px'}}>
    <select onChange={(e)=>setLanguageFilter(e.target.value)} /*...*/> </select>
    <button 
      onClick={() => {
        setShowDeleted(!showDeleted);
        if (!showDeleted) fetchDeleted();  // Load on first click
      }}
      style={{
        background: showDeleted ? '#ef4444' : '#6b7280',
        color: 'white', padding: '10px 16px', borderRadius: '10px',
        border: 'none', cursor: 'pointer', fontWeight: '600'
      }}
    >
      {showDeleted ? '🗑️ Active Files' : '🗑️ Deleted Files'}
    </button>
  </div>
</div>

      {/* --- CODE HISTORY --- */}
      <div style={cardStyle}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'2rem'}}>
          <h2>📋 Submission History</h2>
          <select onChange={(e)=>setLanguageFilter(e.target.value)} style={{background:'#1a202c', color:'white', padding:'10px', borderRadius:'10px'}}>
            <option value="">All Languages</option>
            <option value="Java">Java</option>
            <option value="Python">Python</option>
            <option value="JavaScript">JavaScript</option>
            <option value="C++">C++</option>
          </select>
        </div>
        <table style={{width:'100%', borderCollapse:'separate', borderSpacing:'0 10px'}}>
          <thead>
            <tr><th style={thStyle}>Language</th><th style={thStyle}>File</th><th style={thStyle}>Date</th><th style={thStyle}>Status</th><th style={{...thStyle, textAlign:'center'}}>Actions</th></tr>
          </thead>
          <tbody>
            {showDeleted ? (
              deletedFiles.map(item => (
                <tr key={item.original_id}>
                  <td style={{ ...tdStyle }}>🗑️</td>
                  <td>{item.file_name}</td>
                  <td>{item.language}</td>
                  <td>{new Date(item.deleted_at).toLocaleString()}</td>
                  <td>
                    <span style={{ background: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px' }}>
                      DELETED
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button onClick={() => downloadFile(item.original_id)} style={actionBtn("#3b82f6")}>Download</button>
                    <button onClick={() => undoDelete(item.original_id)} style={{ ...actionBtn("#22c55e") }}>↺ Undo</button>
                  </td>
                </tr>
              ))
            ) : (
              currentItems.map(item => (
                <tr key={item.id}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '15px', borderBottomLeftRadius: '15px' }}>{item.language}</td>
                  <td style={tdStyle}>{item.file_name || "Snippet"}</td>
                  <td style={tdStyle}>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td style={tdStyle}>
                    <div>
                      <span style={{
                        padding: "5px 10px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        background: item.status === "approved" ? "#16a34a" : item.status === "rejected" ? "#dc2626" : "#f59e0b",
                        color: "white"
                      }}>
                        {item.status}
                      </span>
                      {item.status === "rejected" && item.rejection_reason && (
                        <div style={{ fontSize: "11px", color: "#f87171", marginTop: "5px" }}>
                          {item.rejection_reason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '15px', borderBottomRightRadius: '15px', textAlign: 'center' }}>
                    <button onClick={() => viewCode(item.id)} style={actionBtn("#3b82f6")}>View</button>
                    <button onClick={() => deleteCode(item.id)} style={actionBtn("#ef4444")}>Delete</button>
                    <button 
                      onClick={() => analyzeCode(item.id)} 
                      style={{ ...actionBtn("#22c55e"), opacity: isAnalyzing ? 0.5 : 1 }}
                      disabled={isAnalyzing || item.status !== "approved"}
                    >
                      {isAnalyzing ? "Processing..." : "Analyze"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: "14px" }}
          >
            ← Previous
          </button>

          <span style={{ color: "#cbd5e0", padding: "8px 16px" }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            style={{ ...btnPrimary, padding: "8px 16px", fontSize: "14px" }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* --- PROJECT HISTORY --- */}
      <div style={cardStyle}>
        <h2 style={{ marginBottom: '20px' }}>📁 Project Submissions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px', marginTop: '20px' }}>
            <thead>
              <tr><th style={thStyle}>Project Title</th><th style={thStyle}>Domain</th><th style={thStyle}>Tech Stack</th><th style={thStyle}>Course / Category</th><th style={thStyle}>Database</th><th style={{ ...thStyle, textAlign: 'center' }}>Actions</th></tr>
            </thead>
            <tbody>
              {projects.length > 0 ? projects.map((p) => (
                <tr key={p.id}>
                  <td style={{ ...tdStyle, borderTopLeftRadius: '15px', borderBottomLeftRadius: '15px', fontWeight: 'bold' }}>{p.title}</td>
                  <td style={tdStyle}>
                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      {p.domain}
                    </span>
                  </td>
                  <td style={tdStyle}>{p.tech_stack || "Not Specified"}</td>
                  <td style={tdStyle}>{p.course_name || "General"}</td>
                  <td style={tdStyle}>{p.database_type || "N/A"}</td>
                  <td style={{ ...tdStyle, borderTopRightRadius: '15px', borderBottomRightRadius: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button 
                        onClick={() => {
                            console.log("Button Triggered"); // Quick test
                            viewProjectAnalysis(p);
                          }}
                        style={{ 
                          background: '#22c55e', 
                          color: 'white', 
                          padding: '8px 16px', 
                          borderRadius: '8px', 
                          fontSize: '13px', 
                          fontWeight: '600', 
                          border: 'none', 
                          cursor: 'pointer' 
                        }}
                      >
                        Analyze
                      </button>
                      <button 
                        onClick={() => handleDownload(p.id, p.title)} 
                        style={{ background: '#0ea5e9', color: 'white', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => deleteProject(p.id)} 
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    No projects found in your history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "10px" }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{ ...btnPrimary, padding: "8px 16px", fontSize: "14px" }}
            >
              ← Previous
            </button>

            <span style={{ color: "#cbd5e0", padding: "8px 16px" }}>
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{ ...btnPrimary, padding: "8px 16px", fontSize: "14px" }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <footer className="dashboard-footer">
        <p>© 2026 AI Code Analyzer • Developed for Code Quality</p>
      </footer>

      {/* CODE MODAL */}
      {selectedCode && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, backdropFilter:'blur(8px)'}} onClick={()=>setSelectedCode(null)}>
            <div style={{background:'white', padding:'2.5rem', width:'90%', maxWidth:'950px', borderRadius:'24px', animation:'modalScaleIn 0.3s forwards'}} onClick={e=>e.stopPropagation()}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'2px solid #e2e8f0', paddingBottom:'1rem', marginBottom:'1rem'}}>
                    <h2 style={{color:'#1e293b'}}>
                      {editMode ? "📝 Edit Code" : "👁️ Code Viewer"}
                    </h2>
                    <div style={{display:'flex', gap:'10px'}}>
                      {!editMode ? (
                        <button onClick={()=>setEditMode(true)} style={{...btnPrimary, background:'#f59e0b'}}>Edit Code</button>
                      ) : (
                        <button onClick={handleSave} style={{...btnPrimary, background:'#16a34a'}}>Save & Resubmit</button>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            const res = await API.post("/code/share/generate", {
                              submission_id: selectedCode.id,
                              type: "view"
                            });

                            const link = res.data.link;

                            await navigator.clipboard.writeText(link);

                            alert("✅ Link copied to clipboard!");

                          } catch (err) {
                            alert("❌ Failed to copy link");
                          }
                        }}
                        style={{ ...btnPrimary, background: "#0ea5e9" }}
                      >
                        🔗 Share
                      </button>
                      <button onClick={()=>setSelectedCode(null)} style={{...btnPrimary, background:'#64748b'}}>Close</button>
                    </div>
                </div>
                
                <div style={{background:'#1e1e2f', padding:'1rem', borderRadius:'16px', border:'1px solid #334155'}}>
                    {editMode ? (
                      <textarea
                        value={editedCode}
                        onChange={(e) => setEditedCode(e.target.value)}
                        style={{
                          width: '100%',
                          height: '50vh',
                          background: 'transparent',
                          color: '#e2e8f0',
                          border: 'none',
                          outline: 'none',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          resize: 'none'
                        }}
                      />
                    ) : (
                      <div style={{maxHeight:'50vh', overflow:'auto', color:'#e2e8f0', fontFamily:'monospace'}}>
                          <pre>{selectedCode.code}</pre>
                      </div>
                    )}
                </div>
                {/* 💬 COMMENTS SECTION */}
                  <div style={{
                    marginTop: "20px",
                    background: "#f8fafc",
                    padding: "15px",
                    borderRadius: "12px",
                    maxHeight: "200px",
                    overflowY: "auto"
                  }}>
                    <h3 style={{ marginBottom: "10px", color: "#1e293b" }}>💬 Comments</h3>

                    {comments.length === 0 ? (
                      <p style={{ color: "#64748b" }}>No comments yet</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} style={{
                          padding: "8px",
                          marginBottom: "8px",
                          background: "#fff",
                          borderRadius: "8px"
                        }}>
                          <strong style={{ color: c.role === "admin" ? "red" : "#2563eb" }}>
                            {c.name}
                          </strong>
                          <p style={{ margin: "4px 0", color: "#334155" }}>
                            {c.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* ✍️ ADD COMMENT */}
                  <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc"
                      }}
                    />
                    <button
                      onClick={addComment}
                      style={{
                        background: "#2563eb",
                        color: "white",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Send
                    </button>
                  </div>
                <button onClick={()=>downloadFile(selectedCode.id)} style={{...btnPrimary, marginTop:'1rem'}}>Download Original</button>
            </div>
        </div>
      )}

      {/* ANALYSIS MODAL */}
      {/* --- NEW UPDATED ANALYSIS MODAL --- */}
      {analysisResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(10px)' }} onClick={() => setAnalysisResult(null)}>
          <div style={{ background: 'white', width: '95%', maxWidth: '1200px', height: '90vh', borderRadius: '28px', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'modalScaleIn 0.3s ease' }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h2 style={{ color: '#1e293b', margin: 0 }}>🚀 Code Analysis Report</h2>
                <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Score calculated based on security and best practices</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: analysisResult.score > 70 ? '#16a34a' : '#ef4444' }}>{analysisResult.score}/100</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>FINAL QUALITY SCORE</div>
                </div>
                <button onClick={() => setAnalysisResult(null)} style={{ background: '#f1f5f9', border: 'none', padding: '10px 15px', borderRadius: '12px', cursor: 'pointer', fontSize: '20px' }}>×</button>
              </div>
            </div>

            {/* Modal Body: Two Columns */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              
              {/* Left Column: Code Preview */}
              <div style={{ flex: 1.2, background: '#1e1e1e', padding: '20px', overflow: 'auto' }}>
                <div style={{ color: '#858585', fontSize: '12px', marginBottom: '10px', fontWeight: 'bold' }}>SOURCE CODE PREVIEW</div>
                <pre style={{ margin: 0, color: '#d4d4d4', fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}>
                  <code>{analysisResult.code}</code>
                </pre>
                {/* 🏆 FILE REWARD */}
                  {analysisResult.rewards && (
                    <RewardCard 
                      data={analysisResult.rewards} 
                      title="🏆 File Rewards"
                    />
                  )}
              </div>
             

              {/* Right Column: Issues & Suggestions */}
              <div style={{ flex: 1, padding: '25px', overflowY: 'auto', background: '#fff', borderLeft: '1px solid #e2e8f0' }}>
                <h3 style={{ color: '#1e293b', marginTop: 0 }}>Detected Issues ({analysisResult.issues.length})</h3>
                
                {analysisResult.issues.map((issue, idx) => (
                  <div key={idx} style={{ marginBottom: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: issue.type === 'CRITICAL' ? '#fef2f2' : '#fffbeb', borderLeft: `6px solid ${issue.type === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{issue.title}</span>
                      <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '13px' }}>-{issue.penalty}</span>
                    </div>
                    <div style={{ padding: '12px 16px', background: '#f8fafc' }}>
                      <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>💡 SUGGESTED FIX:</div>
                      <div style={{ color: '#334155', fontSize: '14px', fontStyle: 'italic' }}>{issue.suggestion}</div>
                    </div>
                  </div>
                ))}
                {/* 🏆 FILE REWARD
                  {analysisResult.rewards && (
                    <RewardCard 
                      data={analysisResult.rewards} 
                      title="🏆 File Rewards"
                    />
                  )} */}
              </div>
            </div>

            {/* --- ADD THE PROJECT ANALYSIS MODAL HERE --- */}
     
      
            {/* Modal Footer */}
            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', gap: '15px' }}>
              <button onClick={copyIssues} style={{ ...btnPrimary, flex: 1, background: '#0ea5e9' }}>Copy Issues</button>
              <button onClick={exportReport} style={{ ...btnPrimary, flex: 1, background: '#22c55e' }}>Download PDF Report</button>
                {/* <button
                  onClick={async () => {
                    try {
                      
                      const res = await API.post("/code/share/generate", {
                         submission_id: selectedCode?.id, // ✅ correct
                        type: "analyze"
                      });

                      const link = res.data.link;

                      await navigator.clipboard.writeText(link);

                      alert("✅ Report link copied!");

                    } catch (err) {
                      alert("❌ Failed to copy link");
                    }
                  }}
                  style={{ ...btnPrimary, background: "#0ea5e9" }}
                >
                  🔗 Share Report
                </button> */}
              <button onClick={() => setAnalysisResult(null)} style={{ ...btnPrimary, flex: 1, background: '#64748b' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD THE PROJECT ANALYSIS MODAL HERE */}
      {/* ================= PROJECT ANALYSIS MODAL ================= */}
{projectAnalysis && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100000,
      backdropFilter: "blur(10px)",
    }}
    onClick={() => setProjectAnalysis(null)}
  >
    <div
      style={{
        background: "#0f172a",
        width: "90%",
        maxWidth: "900px",
        borderRadius: "24px",
        border: "1px solid #334155",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "90vh",
        animation: "modalScaleIn 0.3s ease",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 30px",
          background: "#1e293b",
          borderBottom: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#fff" }}>
            Project Analysis: {projectAnalysis.title}
          </h2>
          <span
            style={{
              color: "#3b82f6",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            Type: {projectAnalysis.project_type || "Not Detected"}
          </span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color:
                projectAnalysis.score > 70 ? "#22c55e" : "#f59e0b",
            }}
          >
            {projectAnalysis.score || 0}%
          </div>
          <div
            style={{
              fontSize: "10px",
              color: "#94a3b8",
            }}
          >
            QUALITY SCORE
          </div>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "30px",
          overflowY: "auto",
          background: "#0f172a",
          flex: 1,
        }}
      >
        <h3 style={{ color: "#cbd5e0", marginBottom: "20px" }}>
          Detection Summary
        </h3>

        {(() => {
          const issuesRaw = projectAnalysis.issues;
          const issues =
            typeof issuesRaw === "string"
              ? JSON.parse(issuesRaw)
              : issuesRaw || [];

          if (issues.length === 0) {
            return (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#22c55e",
                }}
              >
                ✅ No issues detected in this project.
              </div>
            );
          }

          return (
            <>
              {issues.map((issue, idx) => (
                <div
                  key={`${issue.file || "global"}-${idx}`}
                  style={{
                    background: "#1e293b",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "15px",
                    borderLeft:
                      issue.severity === "HIGH"
                        ? "4px solid #ef4444"
                        : issue.severity === "MEDIUM"
                        ? "4px solid #f59e0b"
                        : "4px solid #64748b",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        color: "#94a3b8",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      {issue.category.replace(/_/g, " ")}
                    </span>
                    <span
                      style={{
                        color:
                          issue.severity === "HIGH"
                            ? "#ef4444"
                            : issue.severity === "MEDIUM"
                            ? "#f59e0b"
                            : "#64748b",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: "600",
                      marginBottom: "4px",
                    }}
                  >
                    {issue.message}
                  </div>
                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    💡 {issue.suggestion}
                  </div>
                  {issue.file && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "11px",
                        color: "#64748b",
                      }}
                    >
                      File: {issue.file.split("/").pop().split("\\").pop() || "file"}
                    </div>
                  )}
                </div>
              ))}

              {/* EXTRA TYPE‑BASED SUGGESTION */}
              {(() => {
                const pt = projectAnalysis.project_type?.toLowerCase();
                if (pt === "full_stack") {
                  return (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "12px",
                        background: "#1e293b",
                        borderRadius: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                        border: "1px solid #334155",
                      }}
                    >
                      💡 Suggested layout: separate backend, frontend, and API layers
                    </div>
                  );
                }
                if (pt === "frontend") {
                  return (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "12px",
                        background: "#1e293b",
                        borderRadius: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                        border: "1px solid #334155",
                      }}
                    >
                      💡 Tips: Use components, pages, and layout folders; keep logic in services
                    </div>
                  );
                }
                if (pt === "backend") {
                  return (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "12px",
                        background: "#1e293b",
                        borderRadius: "12px",
                        color: "#94a3b8",
                        fontStyle: "italic",
                        border: "1px solid #334155",
                      }}
                    >
                      💡 Suggested structure: controllers, routes, models, services, validators
                    </div>
                  );
                }
                return null;
              })()}
            </>
          );
        })()}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "20px 30px",
          background: "#1e293b",
          textAlign: "right",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => setProjectAnalysis(null)}
          style={{ ...btnPrimary, background: "#334155" }}
        >
          Close Report
        </button>
      </div>
    </div>
  </div>
)}

             {/* DETECTING OVERLAY */}
      {isAnalyzingProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,30,0.9)', zIndex: 20000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '20px', animation: 'spin 1s linear infinite' }}></div>
          <h2 style={{ color: '#fff' }}>SCANNING PROJECT...</h2>
        </div>
      )}
     

      
    </div>
  );
   
}

export default History;
