import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

// Shared Dark Theme Styles
const darkThemeStyles = {
  container: {
    backgroundColor: "#0f172a", // Deep Navy
    minHeight: "100vh",
    color: "#f8fafc",
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    background: "rgba(30, 41, 59, 0.8)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #334155",
    padding: "1rem 2rem",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  headerH1: {
    fontSize: "1.5rem",
    margin: 0,
    background: "linear-gradient(90deg, #60a5fa, #a78bfa)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontWeight: "bold",
  },
  headerRight: {
    display: "flex",
    gap: "10px",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    padding: "8px 12px",
    borderRadius: "6px",
    transition: "all 0.2s",
    fontSize: "0.9rem",
    fontWeight: "500",
  },
  navBtnHighlight: {
    color: "#60a5fa",
    background: "rgba(96, 165, 250, 0.1)",
  },
  logoutBtn: {
    color: "#f87171",
  },
  content: {
    padding: "40px 20px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  tableCard: {
    background: "#1e293b",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
    border: "1px solid #334155",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    padding: "16px",
    background: "#334155",
    color: "#94a3b8",
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tr: {
    borderBottom: "1px solid #334155",
    transition: "background 0.2s",
    cursor: "pointer",
  },
  td: {
    padding: "16px",
    fontSize: "0.95rem",
    color: "#e2e8f0",
  },
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    background: "#0f172a",
    color: "#38bdf8",
    fontSize: "0.8rem",
    border: "1px solid #38bdf8",
  }
};

function SavedCodesPage() {
  const [codes, setCodes] = useState([]);
  const navigate = useNavigate();

  // Mock logout function - replace with your actual auth logic
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const res = await API.get("/code/codes");
      setCodes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCode = (code) => {
    navigate("/code-runner", { state: code });
  };

  return (
    <div style={darkThemeStyles.container}>
      {/* Integrated Header */}
      <header style={darkThemeStyles.header}>
        <div style={darkThemeStyles.headerContent}>
          <div style={darkThemeStyles.headerLeft}>
            <h1 style={darkThemeStyles.headerH1}>🚀 AI Code Analyzer</h1>
          </div>
          <div style={darkThemeStyles.headerRight}>
            <button style={darkThemeStyles.navBtn} onClick={() => navigate("/dashboard")}>🏠 Home</button>
            <button style={darkThemeStyles.navBtn} onClick={() => navigate("/analyzer")}>🔍 Analyze</button>
            <button style={darkThemeStyles.navBtn} onClick={() => navigate("/history")}>📚 History</button>
            <button 
              style={{...darkThemeStyles.navBtn, ...darkThemeStyles.navBtnHighlight}} 
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

      {/* Main Content */}
      <main style={darkThemeStyles.content}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "600" }}>Your Saved Snippets</h2>
          <p style={{ color: "#94a3b8" }}>Manage and review your previously saved code executions.</p>
        </div>

        <div style={darkThemeStyles.tableCard}>
          <table style={darkThemeStyles.table}>
            <thead>
              <tr>
                <th style={darkThemeStyles.th}>Title</th>
                <th style={darkThemeStyles.th}>Language</th>
                <th style={darkThemeStyles.th}>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr 
                  key={c.id} 
                  onClick={() => loadCode(c)} 
                  style={darkThemeStyles.tr}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2d3748"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <td style={darkThemeStyles.td}>
                    <strong>{c.title || "Untitled Snippet"}</strong>
                  </td>
                  <td style={darkThemeStyles.td}>
                    <span style={darkThemeStyles.badge}>{c.language}</span>
                  </td>
                  <td style={darkThemeStyles.td}>
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              No saved codes found. Start analyzing to save your first snippet!
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SavedCodesPage;