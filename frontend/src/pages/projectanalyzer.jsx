// components/AnalyzeModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios"; // or fetch

function AnalyzeModal({ isOpen, projectId, projectTitle, onClose }) {
  const [stage, setStage] = useState("idle"); // "idle" | "detecting" | "analyzing" | "done"
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;

    // 1. Show "detecting" for ~2 seconds
    setStage("detecting");
    const detectTimer = setTimeout(() => {
      setStage("analyzing");
      // Call your backend to analyze this project
      analyzeProject(projectId);
    }, 2000);

    return () => clearTimeout(detectTimer);
  }, [isOpen, projectId]);

  const analyzeProject = async (id) => {
    try {
      const res = await axios.post("/api/submitProject", {
        id, // or whatever your backend expects
      });
      setReport(res.data);
      setStage("done");
    } catch (err) {
      console.error("Failed to analyze project:", err);
      setStage("done");
    }
  };

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    width: "80%",
    maxWidth: "700px",
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  };

  const loadingStyle = {
    color: "#4a5568",
    fontStyle: "italic",
    margin: "10px 0",
  };

  const closeBtnStyle = {
    marginTop: "15px",
    padding: "8px 16px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const closeBtnHoverStyle = {
    background: "#2563eb",
  };

  if (!isOpen) return null;

  return (
    <div className="analyze-modal-overlay">
      <div className="analyze-modal-content">
        <h3>Project Analysis — {projectTitle}</h3>

        {/* Stage 1: Detecting project type (2 seconds) */}
        {stage === "detecting" && (
          <p className="analyze-modal-loading">🔍 Detecting project type...</p>
        )}

        {/* Stage 2: Actually analyzing */}
        {stage === "analyzing" && (
          <p className="analyze-modal-loading">⚙️ Analyzing files...</p>
        )}

        {/* Stage 3: Show full report */}
        {stage === "done" && report && (
          <div className="analyze-modal-report">
            <p>
              <strong>Project Type:</strong> {report.projectType}
            </p>
            <p>
              <strong>Score:</strong> {report.score}/100
            </p>

            <h4>Issues</h4>
            <ul className="analyze-issues-list">
              {(report.categories?.code_quality || []).map((issue, idx) => (
                <li key={`code-${idx}`}>
                  🟢 <strong>Code Quality</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.security || []).map((issue, idx) => (
                <li key={`security-${idx}`}>
                  🔐 <strong>Security</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.performance || []).map((issue, idx) => (
                <li key={`perf-${idx}`}>
                  ⚡ <strong>Performance</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.ui_ux || []).map((issue, idx) => (
                <li key={`uiux-${idx}`}>
                  🎨 <strong>UI/UX</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.api_integration || []).map((issue, idx) => (
                <li key={`api-${idx}`}>
                  🔗 <strong>API Integration</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.error_handling || []).map((issue, idx) => (
                <li key={`error-${idx}`}>
                  ⚠️ <strong>Error Handling</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
              {(report.categories?.architecture || []).map((issue, idx) => (
                <li key={`arch-${idx}`}>
                  🏗️ <strong>Architecture</strong>: {issue.message} –{" "}
                  <em>{issue.suggestion}</em>
                </li>
              ))}
            </ul>

            <h4>Suggestions</h4>
            <ul className="analyze-suggestions-list">
              {report.suggestions?.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="analyze-modal-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default AnalyzeModal;