import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom"; // Added useNavigate

function ExplainPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mock functions for missing props in your snippet
  const logout = () => { localStorage.clear(); navigate("/login"); };
  const setShowProjectModal = (val) => console.log("Modal:", val);

  useEffect(() => {
    fetchCodes();
  }, []);

  useEffect(() => {
    if (location.state) {
      handleExplain(location.state);
    }
  }, [location.state]);

  const fetchCodes = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/explain/user-codes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExplain = async (item) => {
    setSelectedCode(item);
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/explain",
        { code: item.code, language: item.language },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const theme = {
    bg: "#0f172a",
    card: "#1e293b",
    accent: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    textMain: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#334155"
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      minHeight: "100vh", 
      background: theme.bg, 
      color: theme.textMain,
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* 🚀 HEADER */}
      <header style={{
        padding: "1rem 2rem",
        background: "#161e2f",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.5rem" }}>🚀</span>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.5px" }}>AI Code Analyzer</h1>
        </div>

        <nav style={{ display: "flex", gap: "10px" }}>
          <button className="nav-btn" onClick={() => navigate("/dashboard")}>Home</button>
          <button className="nav-btn" onClick={() => navigate("/analyzer")}>Analyze</button>
          <button className="nav-btn" onClick={() => navigate("/history")}>History</button>
          <button className="nav-btn" style={{ background: "linear-gradient(45deg, #22c55e, #16a34a)", color: "#fff" }}>📂 Explain Files</button>
          <button className="nav-btn" onClick={() => logout()} style={{ color: theme.danger }}>Logout</button>
        </nav>
      </header>

      {/* ⚡ MAIN CONTENT */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedCode ? (
          <div style={{ padding: "40px 2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
            <div style={{ marginBottom: "30px" }}>
              <h2 style={{ fontSize: "2rem", marginBottom: "8px" }}>Repository Files</h2>
              <p style={{ color: theme.textMuted }}>Select a source file to perform a deep logic analysis.</p>
            </div>

            <div style={{ 
              background: theme.card, 
              borderRadius: "12px", 
              border: `1px solid ${theme.border}`,
              overflow: "hidden",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#334155" }}>
                    {["ID", "Language", "File Name", "Status", "Action"].map(h => (
                      <th key={h} style={{ padding: "15px", color: theme.textMuted, fontSize: "0.85rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: "0.2s" }}>
                      <td style={{ padding: "15px", color: theme.textMuted }}>#{item.id}</td>
                      <td style={{ padding: "15px" }}>
                        <span style={{ background: "#0f172a", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>{item.language}</span>
                      </td>
                      <td style={{ padding: "15px", fontWeight: "500" }}>{item.file_name}</td>
                      <td style={{ padding: "15px" }}>
                        <span style={{ 
                          color: item.status === 'completed' ? theme.success : theme.warning,
                          display: "flex", alignItems: "center", gap: "5px", fontSize: "0.9rem"
                        }}>
                          ● {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "15px" }}>
                        <button 
                          onClick={() => handleExplain(item)}
                          style={{ 
                            padding: '8px 16px', background: theme.accent, color: 'white', 
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600'
                          }}
                        >
                          🧠 Explain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, height: "calc(100vh - 120px)",paddingBottom:"100px" }}>
            {/* LEFT - CODE EDITOR UI */}
            <div style={{ width: "50%",paddingLeft:"100px",paddingBottom:"10px", display: "flex", flexDirection: "column", borderRight: `1px solid ${theme.border}` }}>
              <div style={{ padding: "15px 20px", background: "#161e2f", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", color: theme.accent }}>{selectedCode.file_name}</span>
                <button onClick={() => { setSelectedCode(null); setResult(null); }} 
                  style={{ background: "transparent", color: theme.danger, border: `1px solid ${theme.danger}`, padding: "4px 12px", borderRadius: "4px", cursor: "pointer" }}>
                  Close File
                </button>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "20px", background: "#0b1222" }}>
                <pre style={{ margin: 0, fontFamily: "'Fira Code', monospace", fontSize: "14px", lineHeight: "1.7" }}>
                  {selectedCode.code}
                </pre>
              </div>
               {/* ⚡ OPTIMIZATION SUGGESTIONS */}
                  <section>
                    <h3 style={{ 
                      fontSize: "1.1rem", 
                      marginBottom: "12px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px" 
                    }}>
                      <span style={{ color: theme.warning }}>⚡</span> Optimization Suggestions
                    </h3>

                    {result?.optimizationSuggestions?.length > 0 ? (
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "10px" 
                      }}>
                        {result.optimizationSuggestions.map((s, i) => (
                          <div 
                            key={i}
                            style={{
                              background: theme.card,
                              padding: "15px",
                              borderRadius: "8px",
                              borderLeft: `4px solid ${theme.warning}`,
                              color: "#cbd5e1",
                              fontSize: "14px",
                              lineHeight: "1.5"
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        background: theme.card,
                        padding: "15px",
                        borderRadius: "8px",
                        color: theme.textMuted
                      }}>
                        ✅ No major optimization issues detected.
                      </div>
                    )}
                  </section>
            </div>

            {/* RIGHT - ANALYSIS */}
            <div style={{ width: "50%",paddingRight:"100px",paddingBottom:"10px", overflow: "auto", padding: "30px", background: theme.bg }}>
              {loading ? (
                <div style={{ textAlign: 'center', marginTop: "100px" }}>
                  <div className="spinner"></div>
                  <p style={{ color: theme.textMuted, marginTop: "20px" }}>AI is decoding logic...</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                  
                  {/* SUMMARY SECTION */}
                  <section>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ color: theme.accent }}>📝</span> Summary
                    </h3>
                    <div style={{ background: theme.card, padding: "20px", borderRadius: "8px", borderLeft: `4px solid ${theme.accent}`, color: "#cbd5e1", lineHeight: "1.6" }}>
                      {result?.summary || 'No summary available.'}
                    </div>
                  </section>

                  {/* METRICS GRID */}
                  <section>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>📊 Performance Metrics</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                      {[
                        { label: "Lines", val: result?.metrics?.lines, color: theme.success },
                        { label: "Functions", val: result?.metrics?.functions, color: theme.accent },
                        { label: "Loops", val: result?.metrics?.loops, color: theme.warning },
                        { label: "Complexity", val: result?.metrics?.complexity, color: theme.danger }
                      ].map(m => (
                        <div key={m.label} style={{ background: theme.card, padding: "15px", borderRadius: "8px", textAlign: "center", border: `1px solid ${theme.border}` }}>
                          <span style={{ fontSize: "0.75rem", color: theme.textMuted, display: "block", marginBottom: "5px" }}>{m.label}</span>
                          <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: m.color }}>{m.val || 0}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* EXECUTION FLOW */}
                  <section>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>🧠 Step-by-Step Logic</h3>
                    <div style={{ background: "#0b1222", padding: "20px", borderRadius: "8px", border: `1px solid ${theme.border}`, whiteSpace: "pre-wrap", color: "#94a3b8", fontSize: "14px" }}>
                      {result?.explanation}
                    </div>
                  </section>

                 

                  {/* RAW BREAKDOWN */}
                  <details style={{ cursor: "pointer" }}>
                    <summary style={{ padding: "10px", background: theme.card, borderRadius: "6px", color: theme.textMuted }}>
                      🔍 View Raw Line Breakdown
                    </summary>
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      {result?.lineByLine?.map((l) => (
                        <div key={l.line} style={{ display: "flex", gap: "10px", padding: "8px", background: "#161e2f", borderRadius: "4px", fontSize: "12px" }}>
                          <b style={{ color: theme.accent }}>L{l.line}</b>
                          <code>{l.code}</code>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* 🛠 FOOTER */}
      <footer style={{
        padding: "1rem 2rem",
        background: "#161e2f",
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.85rem",
        color: theme.textMuted
      }}>
        <div>© 2026 AI Code Analyzer • <span style={{ color: theme.success }}>System Online</span></div>
        <div style={{ display: "flex", gap: "20px" }}>
          <span>Privacy Policy</span>
          <span>Documentation</span>
          <span>Support</span>
        </div>
      </footer>

      {/* Inline CSS for the nav buttons and spinner */}
      <style>{`
        .nav-btn {
          background: #334155;
          color: #e2e8f0;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: 0.2s;
        }
        .nav-btn:hover { background: #475569; }
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #334155;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ExplainPage;