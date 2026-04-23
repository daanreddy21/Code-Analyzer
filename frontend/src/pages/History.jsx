import { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCode,
  faBug,
  faBolt,
  faTriangleExclamation,
  faLightbulb,
  faShuffle,
  faDownload,
  faTrash,
  faEye,
  faChartLine,
  faHistory as faHistoryIcon,
  faShare,
  faComment,
  faPaperPlane,
  faRobot,
  faCheckCircle,
  faTimesCircle,
  faClock
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import RewardCard from "../components/RewardCard";
import { io } from "socket.io-client";
import { useTheme } from "../context/ThemeContext";
import EmojiPicker from "emoji-picker-react";

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
  const [projectAnalysis, setProjectAnalysis] = useState(null);
  const [isAnalyzingProject, setIsAnalyzingProject] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const socket = useMemo(() => io("http://localhost:5000"), []);
  const [editMode, setEditMode] = useState(false);
  const [editedCode, setEditedCode] = useState("");
  const [originalCode, setOriginalCode] = useState("");
  const [liveAnalysis, setLiveAnalysis] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const token = localStorage.getItem("token");
  const [showEmoji, setShowEmoji] = useState(false);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const onEmojiClick = (emojiData) => {
  setNewComment((prev) => prev + emojiData.emoji);
  setShowEmoji(false);
};

  // Utility function to format AI explanation text
  const formatAIText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('```')) continue;
      
      if (line.includes('###')) {
        formatted.push(
          <div key={i} style={{ 
            marginTop: i > 0 ? '20px' : 0,
            marginBottom: '12px',
            fontWeight: '700',
            color: themeColors.accent,
            fontSize: '15px',
            borderLeft: `3px solid ${themeColors.accent}`,
            paddingLeft: '12px'
          }}>
            {line.replace(/###/g, '').replace(/\*\*/g, '').trim()}
          </div>
        );
      }
      else if (line.match(/^\d+\./)) {
        formatted.push(
          <div key={i} style={{ 
            marginBottom: '8px',
            marginLeft: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <span style={{ color: themeColors.accent, fontWeight: 'bold', minWidth: '24px' }}>
              {line.match(/^\d+/)[0]}.
            </span>
            <span style={{ color: themeColors.textPrimary, flex: 1 }}>
              {line.replace(/^\d+\./, '').trim()}
            </span>
          </div>
        );
      }
      else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const content = line.replace(/^[-•]\s*/, '');
        formatted.push(
          <div key={i} style={{ 
            marginLeft: '32px', 
            marginBottom: '6px',
            display: 'flex',
            gap: '8px',
            color: themeColors.textSecondary
          }}>
            <span>•</span>
            <span>{content}</span>
          </div>
        );
      }
      else if (line.includes('---')) {
        formatted.push(<hr key={i} style={{ borderColor: themeColors.border, margin: '16px 0' }} />);
      }
      else if (line.includes('`') && !line.includes('```')) {
        const formattedLine = line.replace(/`([^`]+)`/g, (match, code) => {
          return `<code style="background: ${themeColors.accentGlow}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: ${themeColors.success};">${code}</code>`;
        });
        formatted.push(
          <div key={i} style={{ marginBottom: '8px', color: themeColors.textSecondary }}
            dangerouslySetInnerHTML={{ __html: formattedLine }} />
        );
      }
      else if (!line.trim()) {
        formatted.push(<div key={i} style={{ height: '8px' }} />);
      }
      else {
        formatted.push(
          <div key={i} style={{ marginBottom: '8px', color: themeColors.textSecondary, lineHeight: '1.6' }}>
            {line}
          </div>
        );
      }
    }
    
    return formatted;
  };

  useEffect(() => {
    socket.on("new_comment", (comment) => {
      setComments((prev) => [...prev, comment]);
    });
    return () => socket.off("new_comment");
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const timer = setTimeout(() => {
      if (editedCode !== originalCode) {
        runLiveAnalysis(editedCode);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editedCode]);
  
  const fetchVersions = async (id) => {
    try {
      const res = await API.get(`/code/timeline/${id}`);
      const fixedData = res.data.map(v => ({
        ...v,
        issues: typeof v.issues === "string" ? JSON.parse(v.issues) : v.issues
      }));
      setVersions(fixedData);
      setSelectedVersion(fixedData[0]);
    } catch (err) {
      console.error("Fetch versions failed:", err);
    }
  };

  const viewProjectAnalysis = (project) => {
    setProjectAnalysis({
      ...project,
      issues: typeof project.issues === "string" ? JSON.parse(project.issues) : project.issues || [],
      score: project.score || 0
    });
  };

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
      fetchData();
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

  const viewCode = useCallback(async (id) => {
    try {
      const res = await API.get(`/code/${id}`);
      socket.emit("join_submission", id);
      setSelectedCode({...res.data, id: id }); 
      setEditedCode(res.data.code);
      setOriginalCode(res.data.code);
      setLiveAnalysis([]);
      setEditMode(false);
      const commentRes = await API.get(`/comments/${id}`);
      setComments(commentRes.data);
    } catch (err) { 
      alert("Failed to load code"); 
    }
  }, []);

  const runLiveAnalysis = async (newCode) => {
    try {
      const res = await API.post("/code/live-analysis", {
        oldCode: originalCode,
        newCode: newCode
      });
      setLiveAnalysis(res.data.analysis);
    } catch (err) {
      console.error("Live analysis failed", err);
    }
  };

  const runAIAnalysis = async () => {
    try {
      setLoadingAI(true);
      const res = await API.post("/code/ai-analysis", {
        oldCode: originalCode,
        newCode: editedCode,
        language: selectedCode.language
      });
      setAiAnalysis(res.data.analysis || []);
    } catch (err) {
      console.error("AI analysis failed", err);
    } finally {
      setLoadingAI(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await API.post("/comments", {
        submissionId: selectedCode.id,
        comment: newComment
      });
      setNewComment("");
      const res = await API.get(`/comments/${selectedCode.id}`);
      setComments(res.data);
    } catch (err) {
      alert("Failed to add comment");
    }
  };

  const handleSave = async () => {
    try {
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
      setAnalysisResult(null);
      const res = await API.get(`/code/analyze/${id}`);
      setAnalysisResult(res.data);
      await fetchVersions(id);
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

  // Animation styles
  const animationStyles = `
    @keyframes modalScaleIn { 
      from { transform: scale(0.95); opacity: 0; } 
      to { transform: scale(1); opacity: 1; } 
    }
    @keyframes spin { 
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); } 
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    table tr:hover td {
      background: ${themeColors.accentGlow};
    }
    .modal-content {
      animation: modalScaleIn 0.3s ease;
    }
  `;

  if (loading) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        background: themeColors.background, 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center" 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '48px', height: '48px', border: `4px solid ${themeColors.border}`, borderTop: `4px solid ${themeColors.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
          <p style={{ color: themeColors.textSecondary }}>Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: themeColors.background, 
      color: themeColors.textPrimary,
      paddingTop: "50px",
      paddingBottom: "60px"
    }}>
      <style>{animationStyles}</style>

      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            padding: '8px 20px',
            borderRadius: '40px',
            marginBottom: '20px'
          }}>
            <FontAwesomeIcon icon={faHistoryIcon} size="lg" color="#fff" />
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>Code History</span>
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
            Submission History
          </h1>
          <p style={{ color: themeColors.textSecondary, fontSize: '1rem' }}>
            Track and analyze all your code submissions
          </p>
        </div>

        {/* CODE HISTORY SECTION */}
        <div style={{ 
          background: themeColors.cardBg, 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: '24px', 
          padding: '28px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
              <FontAwesomeIcon icon={faCode} color={themeColors.accent} /> Code Submissions
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  if (!showDeleted) fetchDeleted();
                }}
                style={{
                  background: showDeleted ? themeColors.danger : themeColors.border,
                  color: themeColors.textPrimary,
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '13px'
                }}
              >
                {showDeleted ? '📁 Active Files' : '🗑️ Deleted Files'}
              </button>
              <select 
                onChange={(e) => setLanguageFilter(e.target.value)} 
                value={languageFilter}
                style={{
                  background: themeColors.background,
                  color: themeColors.textPrimary,
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: `1px solid ${themeColors.border}`,
                  cursor: 'pointer'
                }}
              >
                <option value="">All Languages</option>
                <option value="Java">☕ Java</option>
                <option value="Python">🐍 Python</option>
                <option value="JavaScript">📜 JavaScript</option>
                <option value="C++">⚙️ C++</option>
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${themeColors.border}` }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Language</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>File</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {showDeleted ? (
                  deletedFiles.map(item => (
                    <tr key={item.original_id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '16px' }}>🗑️</td>
                      <td style={{ padding: '16px', fontWeight: '500', color: themeColors.textPrimary }}>{item.file_name}</td>
                      <td style={{ padding: '16px', color: themeColors.textSecondary }}>{item.language}</td>
                      <td style={{ padding: '16px', color: themeColors.textSecondary }}>{new Date(item.deleted_at).toLocaleString()}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ background: themeColors.danger, color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                          DELETED
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button onClick={() => downloadFile(item.original_id)} style={actionButtonStyle(themeColors, themeColors.info)}>
                          <FontAwesomeIcon icon={faDownload} /> Download
                        </button>
                        <button onClick={() => undoDelete(item.original_id)} style={actionButtonStyle(themeColors, themeColors.success)}>
                          ↺ Undo
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  currentItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${themeColors.border}`, transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          background: themeColors.accentGlow, 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '12px',
                          color: themeColors.accent
                        }}>
                          {item.language}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontWeight: '500', color: themeColors.textPrimary }}>{item.file_name || "Snippet"}</td>
                      <td style={{ padding: '16px', color: themeColors.textSecondary, fontSize: '13px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "600",
                          background: item.status === "approved" ? themeColors.success : 
                                      item.status === "rejected" ? themeColors.danger : themeColors.warning,
                          color: "white"
                        }}>
                          {item.status === "approved" ? "✓ Approved" : item.status === "rejected" ? "✗ Rejected" : "⏳ Pending"}
                        </span>
                        {item.status === "rejected" && item.rejection_reason && (
                          <div style={{ fontSize: "11px", color: themeColors.danger, marginTop: "5px" }}>
                            {item.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => viewCode(item.id)} style={actionButtonStyle(themeColors, themeColors.info)}>
                            <FontAwesomeIcon icon={faEye} /> View
                          </button>
                          <button onClick={() => deleteCode(item.id)} style={actionButtonStyle(themeColors, themeColors.danger)}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                          <button 
                            onClick={() => analyzeCode(item.id)} 
                            style={{ ...actionButtonStyle(themeColors, themeColors.success), opacity: isAnalyzing || item.status !== "approved" ? 0.5 : 1 }}
                            disabled={isAnalyzing || item.status !== "approved"}
                          >
                            {isAnalyzing ? <span className="spinner-small"></span> : <FontAwesomeIcon icon={faChartLine} />}
                            Analyze
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {!showDeleted && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "24px", gap: "12px" }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={paginationButtonStyle(themeColors, currentPage === 1)}
              >
                ← Previous
              </button>
              <span style={{ color: themeColors.textSecondary, padding: "8px 16px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={paginationButtonStyle(themeColors, currentPage === totalPages)}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* PROJECT HISTORY SECTION */}
        <div style={{ 
          background: themeColors.cardBg, 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: '24px', 
          padding: '28px'
        }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
            <FontAwesomeIcon icon={faCode} color={themeColors.success} /> Project Submissions
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${themeColors.border}` }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Project Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Domain</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Tech Stack</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Course</th>
                  <th style={{ padding: '16px', textAlign: 'center', color: themeColors.textSecondary, fontSize: '12px', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.length > 0 ? projects.map((p) => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: themeColors.textPrimary }}>{p.title}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        background: themeColors.accentGlow, 
                        color: themeColors.accent, 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        {p.domain}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: themeColors.textSecondary }}>{p.tech_stack || "Not Specified"}</td>
                    <td style={{ padding: '16px', color: themeColors.textSecondary }}>{p.course_name || "General"}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => viewProjectAnalysis(p)} style={actionButtonStyle(themeColors, themeColors.success)}>
                          <FontAwesomeIcon icon={faChartLine} /> Analyze
                        </button>
                        <button onClick={() => handleDownload(p.id, p.title)} style={actionButtonStyle(themeColors, themeColors.info)}>
                          <FontAwesomeIcon icon={faDownload} /> Download
                        </button>
                        <button onClick={() => deleteProject(p.id)} style={actionButtonStyle(themeColors, themeColors.danger)}>
                          <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '60px', textAlign: 'center', color: themeColors.textSecondary }}>
                      <FontAwesomeIcon icon={faCode} size="2x" style={{ marginBottom: '12px', opacity: 0.5 }} />
                      <p>No projects found in your history.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* CODE VIEW MODAL */}
      {selectedCode && (
        <div style={modalOverlayStyle} onClick={() => setSelectedCode(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '1200px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(themeColors)}>
              <div>
                <h2 style={{ margin: 0, color: themeColors.textPrimary }}>
                  {editMode ? "✏️ Edit Code" : "👁️ Code Viewer"}
                </h2>
                <p style={{ margin: '4px 0 0 0', color: themeColors.textSecondary, fontSize: '13px' }}>
                  {selectedCode.file_name}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} style={buttonStyle(themeColors, themeColors.warning)}>
                    ✏️ Edit Code
                  </button>
                ) : (
                  <button onClick={handleSave} style={buttonStyle(themeColors, themeColors.success)}>
                    💾 Save & Resubmit
                  </button>
                )}
                <button onClick={async () => {
                  try {
                    const res = await API.post("/code/share/generate", {
                      submission_id: selectedCode.id,
                      type: "view"
                    });
                    await navigator.clipboard.writeText(res.data.link);
                    alert("✅ Link copied to clipboard!");
                  } catch (err) {
                    alert("❌ Failed to copy link");
                  }
                }} style={buttonStyle(themeColors, themeColors.info)}>
                  <FontAwesomeIcon icon={faShare} /> Share
                </button>
                <button onClick={() => setSelectedCode(null)} style={buttonStyle(themeColors, themeColors.textSecondary)}>
                  Close
                </button>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "20px", padding: "24px", flexWrap: "wrap" }}>
              {/* LEFT - EDITOR */}
              <div style={{ flex: editMode ? "2" : "1", minWidth: "300px" }}>
                <div style={{ 
                  background: themeColors.background, 
                  padding: "16px", 
                  borderRadius: "16px",
                  border: `1px solid ${themeColors.border}`
                }}>
                  {editMode ? (
                    <textarea
                      value={editedCode}
                      onChange={(e) => setEditedCode(e.target.value)}
                      style={{
                        width: "100%",
                        minHeight: "400px",
                        background: "transparent",
                        color: themeColors.textPrimary,
                        border: "none",
                        outline: "none",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "13px",
                        lineHeight: "1.6",
                        resize: "vertical"
                      }}
                    />
                  ) : (
                    <pre style={{ 
                      margin: 0, 
                      color: themeColors.textPrimary, 
                      fontFamily: "'Fira Code', monospace", 
                      fontSize: "13px",
                      lineHeight: "1.6",
                      whiteSpace: "pre-wrap"
                    }}>
                      {selectedCode.code}
                    </pre>
                  )}
                </div>
              </div>

              {/* RIGHT - LIVE ANALYSIS */}
              {editMode && (
                <div style={{ flex: "1", minWidth: "280px" }}>
                  <div style={{ 
                    background: themeColors.background, 
                    padding: "16px", 
                    borderRadius: "16px",
                    border: `1px solid ${themeColors.border}`,
                    maxHeight: "500px",
                    overflowY: "auto"
                  }}>
                    <h3 style={{ marginBottom: "12px", display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                      <FontAwesomeIcon icon={faShuffle} /> Code Impact Analysis
                    </h3>
                    <button
                      onClick={runAIAnalysis}
                      style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "16px",
                        background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "600"
                      }}
                    >
                      {loadingAI ? "⏳ Analyzing..." : "🤖 AI Analyze"}
                    </button>

                    {liveAnalysis.length === 0 && aiAnalysis.length === 0 ? (
                      <p style={{ color: themeColors.textSecondary, textAlign: 'center', padding: '20px' }}>
                        No changes detected
                      </p>
                    ) : (
                      <>
                        {liveAnalysis.map((item, i) => (
                          <div key={i} style={analysisItemStyle(themeColors, item.severity)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <strong style={{ color: themeColors.textPrimary }}>{item.title || item.type}</strong>
                              <span style={severityBadgeStyle(themeColors, item.severity)}>{item.severity}</span>
                            </div>
                            <p style={{ fontSize: "12px", color: themeColors.textSecondary }}>Line {item.line}</p>
                            {item.whatChanged && (
                              <p style={{ margin: "6px 0", fontSize: "13px" }}>
                                <strong>What Changed:</strong><br />
                                {item.whatChanged}
                              </p>
                            )}
                            {item.impact && (
                              <div style={{ margin: "6px 0" }}>
                                <strong>Impact:</strong>
                                <ul style={{ margin: "4px 0 0 16px", color: themeColors.textSecondary }}>
                                  {item.impact.map((imp, idx) => <li key={idx}>{imp}</li>)}
                                </ul>
                              </div>
                            )}
                            {item.scenario && (
                              <p style={{ margin: "6px 0", fontSize: "13px" }}>
                                <strong>Real Scenario:</strong><br />
                                {item.scenario}
                              </p>
                            )}
                            <p style={{ marginTop: "8px", paddingTop: "6px", borderTop: `1px solid ${themeColors.border}` }}>
                              <strong>Fix:</strong> {item.suggestion}
                            </p>
                          </div>
                        ))}
                        
                        {aiAnalysis.map((item, i) => (
                          <div key={`ai-${i}`} style={analysisItemStyle(themeColors, item.severity)}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <strong style={{ color: themeColors.textPrimary }}>🤖 {item.title}</strong>
                              <span style={severityBadgeStyle(themeColors, item.severity)}>{item.severity}</span>
                            </div>
                            <p><strong>What Changed:</strong> {item.whatChanged}</p>
                            <ul style={{ margin: "4px 0 0 16px", color: themeColors.textSecondary }}>
                              {item.impact?.map((imp, idx) => <li key={idx}>{imp}</li>)}
                            </ul>
                            <p><strong>Scenario:</strong> {item.scenario}</p>
                            <p><strong>Fix:</strong> {item.suggestion}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* COMMENTS SECTION */}
            <div style={{ padding: "0 24px 24px 24px" }}>
              <div style={{ 
                background: themeColors.bgInner, 
                padding: "16px", 
                borderRadius: "12px",
                marginBottom: "16px",
                maxHeight: "150px",
                overflowY: "auto"
              }}>
                <h3 style={{ marginBottom: "12px", fontSize: "14px", display: 'flex', alignItems: 'center', gap: '8px', color: themeColors.textPrimary }}>
                  <FontAwesomeIcon icon={faComment} /> Comments ({comments.length})
                </h3>
                {comments.length === 0 ? (
                  <p style={{ color: themeColors.textSecondary, fontSize: "13px" }}>No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{
                      padding: "10px",
                      marginBottom: "8px",
                      background: themeColors.cardBg,
                      borderRadius: "8px",
                      border: `1px solid ${themeColors.border}`
                    }}>
                      <strong style={{ color: c.role === "admin" ? themeColors.danger : themeColors.accent }}>
                        {c.name}
                      </strong>
                      <p style={{ margin: "4px 0 0 0", color: themeColors.textSecondary, fontSize: "13px" }}>
                        {c.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  
                  <input
                    type="text"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${themeColors.border}`,
                      background: themeColors.background,
                      color: themeColors.textPrimary
                    }}
                  />

                  {/* 😊 EMOJI BUTTON */}
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    style={{
                      padding: "0 14px",
                      fontSize: "18px",
                      borderRadius: "10px",
                      border: `1px solid ${themeColors.border}`,
                      background: themeColors.cardBg,
                      cursor: "pointer"
                    }}
                  >
                    😊
                  </button>

                  {/* SEND BUTTON */}
                  <button onClick={addComment} style={buttonStyle(themeColors, themeColors.accent)}>
                    <FontAwesomeIcon icon={faPaperPlane} /> Send
                  </button>
                </div>

                {/* 🔥 EMOJI PICKER */}
                {showEmoji && (
                  <div style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "10px",
                    zIndex: 1000
                  }}>
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "0 24px 24px 24px" }}>
              <button onClick={() => downloadFile(selectedCode.id)} style={buttonStyle(themeColors, themeColors.info)}>
                <FontAwesomeIcon icon={faDownload} /> Download Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS MODAL */}
      {analysisResult && (
        <div style={modalOverlayStyle} onClick={() => setAnalysisResult(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(themeColors)}>
              <div>
                <h2 style={{ margin: 0, color: themeColors.textPrimary }}>🚀 Code Analysis Report</h2>
                <p style={{ margin: '4px 0 0 0', color: themeColors.textSecondary }}>Score calculated based on security and best practices</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <select
                  value={selectedVersion?.version || ""}
                  onChange={(e) => {
                    const v = versions.find(v => v.version == e.target.value);
                    setSelectedVersion(v);
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${themeColors.border}`,
                    background: themeColors.cardBg,
                    color: themeColors.textPrimary
                  }}
                >
                  {versions.map(v => (
                    <option key={v.version} value={v.version}>Version {v.version}</option>
                  ))}
                </select>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: themeColors.success }}>
                    {(selectedVersion?.score || analysisResult.score)}/100
                  </div>
                  <div style={{ fontSize: '11px', color: themeColors.textSecondary, fontWeight: 'bold' }}>
                    QUALITY SCORE
                  </div>
                </div>
                <button onClick={() => setAnalysisResult(null)} style={closeButtonStyle(themeColors)}>×</button>
              </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexWrap: 'wrap' }}>
              <div style={{ flex: 1.2, background: themeColors.background, padding: '24px', overflow: 'auto', minWidth: '300px' }}>
                <div style={{ color: themeColors.textSecondary, fontSize: '11px', marginBottom: '12px', fontWeight: 'bold' }}>SOURCE CODE PREVIEW</div>
                <pre style={{ margin: 0, color: themeColors.textPrimary, fontFamily: "'Fira Code', monospace", fontSize: '13px', lineHeight: '1.6' }}>
                  <code>{selectedVersion?.code || analysisResult.code}</code>
                </pre>
                {analysisResult.rewards && (
                  <RewardCard data={analysisResult.rewards} title="🏆 File Rewards" />
                )}
              </div>

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: themeColors.cardBg, borderLeft: `1px solid ${themeColors.border}`, minWidth: '350px' }}>
                <h3 style={{ color: themeColors.textPrimary, marginTop: 0 }}>
                  Detected Issues ({(selectedVersion?.issues || analysisResult.issues).length})
                </h3>
                
                {(selectedVersion?.issues || analysisResult.issues).map((issue, idx) => (
                  <div key={idx} style={issueCardStyle(themeColors, issue.type)}>
                    <div style={{ 
                      padding: '12px 16px', 
                      background: issue.type === 'CRITICAL' ? 'rgba(245, 101, 101, 0.1)' : 'rgba(237, 137, 54, 0.1)',
                      borderLeft: `4px solid ${issue.type === 'CRITICAL' ? themeColors.danger : themeColors.warning}`,
                      display: 'flex', 
                      justifyContent: 'space-between' 
                    }}>
                      <span style={{ fontWeight: 'bold', color: themeColors.textPrimary }}>{issue.title}</span>
                      <span style={{ color: themeColors.danger, fontWeight: 'bold', fontSize: '12px' }}>-{issue.penalty}</span>
                    </div>
                    <div style={{ padding: '12px 16px', background: themeColors.bgInner }}>
                      <div style={{ color: themeColors.textSecondary, fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>💡 SUGGESTED FIX:</div>
                      <div style={{ color: themeColors.textSecondary, fontSize: '13px', fontStyle: 'italic' }}>{issue.suggestion}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px 24px', borderTop: `1px solid ${themeColors.border}`, display: 'flex', gap: '12px' }}>
              <button onClick={copyIssues} style={{ ...buttonStyle(themeColors, themeColors.info), flex: 1 }}>📋 Copy Issues</button>
              <button onClick={exportReport} style={{ ...buttonStyle(themeColors, themeColors.success), flex: 1 }}>📄 Download Report</button>
              <button onClick={() => setAnalysisResult(null)} style={{ ...buttonStyle(themeColors, themeColors.textSecondary), flex: 1 }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT ANALYSIS MODAL */}
      {projectAnalysis && (
        <div style={modalOverlayStyle} onClick={() => setProjectAnalysis(null)}>
          <div style={{ ...modalContentStyle, maxWidth: '900px', width: '90%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle(themeColors)}>
              <div>
                <h2 style={{ margin: 0, color: themeColors.textPrimary }}>Project Analysis: {projectAnalysis.title}</h2>
                <span style={{ color: themeColors.accent, fontSize: "11px", fontWeight: "bold", textTransform: "uppercase" }}>
                  Type: {projectAnalysis.project_type || "Not Detected"}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: projectAnalysis.score > 70 ? themeColors.success : themeColors.warning }}>
                  {projectAnalysis.score || 0}%
                </div>
                <div style={{ fontSize: "10px", color: themeColors.textSecondary }}>QUALITY SCORE</div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <h3 style={{ color: themeColors.textPrimary, marginBottom: "16px" }}>Detection Summary</h3>
              {(() => {
                const issuesRaw = projectAnalysis.issues;
                const issues = typeof issuesRaw === "string" ? JSON.parse(issuesRaw) : issuesRaw || [];

                if (issues.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "60px", color: themeColors.success }}>
                      <FontAwesomeIcon icon={faCheckCircle} size="2x" style={{ marginBottom: '12px' }} />
                      <p>✅ No issues detected in this project.</p>
                    </div>
                  );
                }

                return (
                  <>
                    {issues.map((issue, idx) => (
                      <div key={idx} style={issueCardStyle(themeColors, issue.severity)}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ color: themeColors.textSecondary, fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}>
                            {issue.category?.replace(/_/g, " ")}
                          </span>
                          <span style={severityBadgeStyle(themeColors, issue.severity)}>{issue.severity}</span>
                        </div>
                        <div style={{ color: themeColors.textPrimary, fontWeight: "600", marginBottom: "4px" }}>{issue.message}</div>
                        <div style={{ color: themeColors.textSecondary, fontSize: "13px", fontStyle: "italic" }}>💡 {issue.suggestion}</div>
                        {issue.file && (
                          <div style={{ marginTop: "6px", fontSize: "11px", color: themeColors.textSecondary }}>
                            File: {issue.file.split("/").pop().split("\\").pop()}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Type-based suggestions */}
                    {(() => {
                      const pt = projectAnalysis.project_type?.toLowerCase();
                      if (pt === "full_stack") {
                        return (
                          <div style={tipBoxStyle(themeColors)}>
                            💡 Suggested layout: separate backend, frontend, and API layers
                          </div>
                        );
                      }
                      if (pt === "frontend") {
                        return (
                          <div style={tipBoxStyle(themeColors)}>
                            💡 Tips: Use components, pages, and layout folders; keep logic in services
                          </div>
                        );
                      }
                      if (pt === "backend") {
                        return (
                          <div style={tipBoxStyle(themeColors)}>
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

            <div style={{ padding: "20px 24px", borderTop: `1px solid ${themeColors.border}`, textAlign: "right" }}>
              <button onClick={() => setProjectAnalysis(null)} style={buttonStyle(themeColors, themeColors.textSecondary)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isAnalyzingProject && (
        <div style={modalOverlayStyle}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: `4px solid ${themeColors.border}`, borderTop: `4px solid ${themeColors.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
            <h2 style={{ color: '#fff' }}>SCANNING PROJECT...</h2>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper style functions
const actionButtonStyle = (themeColors, bgColor) => ({
  padding: "6px 12px",
  background: bgColor,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "12px",
  transition: "transform 0.2s"
});

const buttonStyle = (themeColors, bgColor) => ({
  padding: "8px 16px",
  background: bgColor,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  transition: "transform 0.2s"
});

const paginationButtonStyle = (themeColors, disabled) => ({
  padding: "8px 16px",
  background: disabled ? themeColors.border : themeColors.accent,
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: "600",
  opacity: disabled ? 0.5 : 1
});

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.9)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  backdropFilter: 'blur(10px)'
};

const modalContentStyle = {
  background: '#111122',
  borderRadius: '24px',
  border: '1px solid #1a1a2e',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh'
};

const modalHeaderStyle = (themeColors) => ({
  padding: '20px 24px',
  background: themeColors.bgInner,
  borderBottom: `1px solid ${themeColors.border}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px'
});

const closeButtonStyle = (themeColors) => ({
  background: themeColors.border,
  border: 'none',
  padding: '8px 16px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '20px',
  color: themeColors.textPrimary
});

const issueCardStyle = (themeColors, severity) => ({
  marginBottom: '16px',
  borderRadius: '12px',
  border: `1px solid ${themeColors.border}`,
  overflow: 'hidden'
});

const severityBadgeStyle = (themeColors, severity) => ({
  fontSize: "10px",
  padding: "2px 8px",
  borderRadius: "12px",
  fontWeight: "bold",
  background: severity === "HIGH" || severity === "CRITICAL" ? themeColors.danger :
              severity === "MEDIUM" ? themeColors.warning : themeColors.textSecondary,
  color: "white"
});

const analysisItemStyle = (themeColors, severity) => ({
  border: `1px solid ${themeColors.border}`,
  borderLeft: severity === "CRITICAL" ? `4px solid ${themeColors.danger}` :
               severity === "HIGH" ? `4px solid ${themeColors.warning}` :
               `4px solid ${themeColors.accent}`,
  padding: "14px",
  marginBottom: "12px",
  borderRadius: "12px",
  background: themeColors.cardBg
});

const tipBoxStyle = (themeColors) => ({
  marginTop: "20px",
  padding: "12px",
  background: themeColors.cardBg,
  borderRadius: "12px",
  color: themeColors.textSecondary,
  fontStyle: "italic",
  border: `1px solid ${themeColors.border}`
});

export default History;