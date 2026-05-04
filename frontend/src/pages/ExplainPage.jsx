import { useEffect, useState } from "react";
import { useRef } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  FaBrain, 
  FaChartLine, 
  FaCode, 
  FaFileAlt, 
  FaLightbulb, 
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaMicroscope
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

function ExplainPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const codeRef = useRef(null);
  const scrollTimeout = useRef(null);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const logout = () => { 
    localStorage.clear(); 
    navigate("/login"); 
  };
  
  const setShowProjectModal = (val) => console.log("Modal:", val);

  useEffect(() => {
    fetchCodes();
  }, []);

  useEffect(() => {
    if (location.state) {
      handleExplain(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    const el = codeRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll);

    return () => el.removeEventListener("scroll", handleScroll);
  }, [selectedCode]);

  const handleScroll = () => {
    const el = codeRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    if (scrollHeight <= clientHeight + 5) {
      setShowProgressBar(false);
      return;
    }

    setShowProgressBar(scrollTop > 5);

    if (scrollTop === 0) {
      setScrollProgress(0);
    }

    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(progress);

    setIsScrolling(true);

    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

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

    setScrollProgress(0);
    setShowProgressBar(false);
    setIsScrolling(false);
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

  // Utility function to format AI explanation text
  const formatExplanationText = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip code block markers
      if (line.includes('```')) continue;
      
      // Format main headers (### **Header**)
      if (line.includes('###')) {
        formatted.push(
          <div key={i} style={{ 
            marginTop: i > 0 ? '20px' : '0',
            marginBottom: '12px',
            fontWeight: '700',
            color: themeColors.accent,
            fontSize: '16px',
            borderLeft: `3px solid ${themeColors.accent}`,
            paddingLeft: '12px'
          }}>
            {line.replace(/###/g, '').replace(/\*\*/g, '').trim()}
          </div>
        );
      }
      // Format numbered steps (1., 2., etc.)
      else if (line.match(/^\d+\./)) {
        formatted.push(
          <div key={i} style={{ 
            marginBottom: '8px',
            marginLeft: '16px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <span style={{ 
              color: themeColors.accent, 
              fontWeight: 'bold',
              minWidth: '24px'
            }}>
              {line.match(/^\d+/)[0]}.
            </span>
            <span style={{ color: themeColors.textPrimary, flex: 1 }}>
              {line.replace(/^\d+\./, '').trim()}
            </span>
          </div>
        );
      }
      // Format bullet points with **bold text**
      else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const content = line.replace(/^[-•]\s*/, '');
        // Check if content has bold markers
        if (content.includes('**')) {
          const parts = content.split(/\*\*/);
          formatted.push(
            <div key={i} style={{ 
              marginLeft: '32px', 
              marginBottom: '6px',
              display: 'flex',
              gap: '8px',
              color: themeColors.textSecondary
            }}>
              <span>•</span>
              <span>
                {parts.map((part, idx) => {
                  if (idx % 2 === 1) {
                    return <strong key={idx} style={{ color: themeColors.warning }}>{part}</strong>;
                  }
                  return part;
                })}
              </span>
            </div>
          );
        } else {
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
      }
      // Format separator lines
      else if (line.includes('---')) {
        formatted.push(<hr key={i} style={{ borderColor: themeColors.border, margin: '16px 0' }} />);
      }
      // Format code blocks or inline code
      else if (line.includes('`') && !line.includes('```')) {
        const formattedLine = line.replace(/`([^`]+)`/g, (match, code) => {
          return `<code style="background: ${themeColors.accentGlow}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: ${themeColors.success};">${code}</code>`;
        });
        formatted.push(
          <div 
            key={i} 
            style={{ marginBottom: '8px', color: themeColors.textSecondary }}
            dangerouslySetInnerHTML={{ __html: formattedLine }}
          />
        );
      }
      // Format example output blocks
      else if (line.includes('Example:') || line.includes('**Example:**')) {
        formatted.push(
          <div key={i} style={{ 
            marginTop: '12px',
            marginBottom: '8px',
            fontWeight: '600',
            color: themeColors.info
          }}>
            📌 {line.replace(/\*\*/g, '').trim()}
          </div>
        );
      }
      // Format output/pre blocks
      else if (line.trim().match(/^\d+\+\d+=\d+/) || line.includes('Output:')) {
        formatted.push(
          <div key={i} style={{ 
            fontFamily: 'monospace', 
            fontSize: '12px',
            color: themeColors.success,
            marginLeft: '32px',
            marginBottom: '4px'
          }}>
            {line}
          </div>
        );
      }
      // Empty line
      else if (!line.trim()) {
        formatted.push(<div key={i} style={{ height: '8px' }} />);
      }
      // Regular text with bold markers
      else {
        if (line.includes('**')) {
          const parts = line.split(/\*\*/);
          formatted.push(
            <div key={i} style={{ marginBottom: '8px', color: themeColors.textSecondary, lineHeight: '1.6' }}>
              {parts.map((part, idx) => {
                if (idx % 2 === 1) {
                  return <strong key={idx} style={{ color: themeColors.warning }}>{part}</strong>;
                }
                return part;
              })}
            </div>
          );
        } else {
          formatted.push(
            <div key={i} style={{ marginBottom: '8px', color: themeColors.textSecondary, lineHeight: '1.6' }}>
              {line}
            </div>
          );
        }
      }
    }
    
    return formatted;
  };

  // Format optimization suggestions
  const formatSuggestions = (suggestions) => {
    if (!suggestions || suggestions.length === 0) return null;
    
    return suggestions.map((s, i) => {
      // Check if suggestion contains line breaks or formatting
      if (s.includes('\n')) {
        const parts = s.split('\n');
        return (
          <div 
            key={i}
            style={{
              background: 'rgba(237, 137, 54, 0.1)',
              padding: "15px",
              borderRadius: "8px",
              borderLeft: `4px solid ${themeColors.warning}`,
              marginBottom: "10px"
            }}
          >
            {parts.map((part, idx) => {
              if (part.includes('**')) {
                const textParts = part.split(/\*\*/);
                return (
                  <div key={idx} style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.5", marginBottom: idx < parts.length - 1 ? '8px' : 0 }}>
                    {textParts.map((tp, tpidx) => {
                      if (tpidx % 2 === 1) {
                        return <strong key={tpidx} style={{ color: themeColors.warning }}>{tp}</strong>;
                      }
                      return tp;
                    })}
                  </div>
                );
              }
              return <div key={idx} style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: "1.5", marginBottom: idx < parts.length - 1 ? '8px' : 0 }}>{part}</div>;
            })}
          </div>
        );
      }
      
      return (
        <div 
          key={i}
          style={{
            background: 'rgba(237, 137, 54, 0.1)',
            padding: "15px",
            borderRadius: "8px",
            borderLeft: `4px solid ${themeColors.warning}`,
            color: "#cbd5e1",
            fontSize: "14px",
            lineHeight: "1.5",
            marginBottom: "10px"
          }}
        >
          {s.includes('**') ? (
            s.split(/\*\*/).map((part, idx) => {
              if (idx % 2 === 1) {
                return <strong key={idx} style={{ color: themeColors.warning }}>{part}</strong>;
              }
              return part;
            })
          ) : (
            s
          )}
        </div>
      );
    });
  };

  // Format line-by-line breakdown
  const formatLineByLine = (lines) => {
    if (!lines || lines.length === 0) return null;
    
    return lines.map((l) => (
      <div key={l.line} style={{ 
        display: "flex", 
        gap: "10px", 
        padding: "10px", 
        background: themeColors.bgInner,
        borderRadius: "6px", 
        fontSize: "12px",
        marginBottom: "6px",
        borderLeft: `2px solid ${themeColors.accent}`
      }}>
        <b style={{ color: themeColors.accent, minWidth: "35px" }}>L{l.line}</b>
        <code style={{ color: themeColors.textSecondary, flex: 1, fontFamily: "'Fira Code', monospace" }}>
          {l.code}
        </code>
      </div>
    ));
  };

  // Animation styles
  const animationStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
      @keyframes progressShimmer {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }
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
    table tr:hover {
      background: ${themeColors.accentGlow};
    }
  `;

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      minHeight: "100vh", 
      background: themeColors.background, 
      color: themeColors.textPrimary,
      fontFamily: "'Inter', sans-serif"
    }}>
      <style>{animationStyles}</style>
      
      {/* MAIN CONTENT */}
      <main style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        paddingTop: "8px"
      }}>
        {!selectedCode ? (
          <div style={{ padding: "40px 2rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
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
                <FaBrain size={20} color="#fff" />
                <span style={{ color: '#fff', fontWeight: '600', fontSize: '14px' }}>AI Code Analysis</span>
              </div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #fff 0%, #5a67d8 100%)'
                  : 'linear-gradient(135deg, #1a1a2e 0%, #5a67d8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px'
              }}>
                Repository Files
              </h1>
              <p style={{ color: themeColors.textSecondary, fontSize: '1rem' }}>
                Select a source file to perform deep logic analysis with AI
              </p>
            </div>

            {/* Files Table */}
            <div style={{ 
              background: themeColors.cardBg, 
              borderRadius: "20px", 
              border: `1px solid ${themeColors.border}`,
              overflow: "hidden",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
            }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: themeColors.accentGlow }}>
                    {["ID", "Language", "File Name", "Status", "Action"].map(h => (
                      <th key={h} style={{ 
                        padding: "16px", 
                        color: themeColors.textSecondary, 
                        fontSize: "0.75rem", 
                        textTransform: "uppercase",
                        fontWeight: "600",
                        letterSpacing: "0.5px"
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.id} style={{ borderBottom: `1px solid ${themeColors.border}`, transition: "0.2s" }}>
                      <td style={{ padding: "16px", color: themeColors.textSecondary, fontSize: "13px" }}>#{item.id}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          background: themeColors.accentGlow, 
                          padding: "4px 10px", 
                          borderRadius: "6px", 
                          fontSize: "0.75rem",
                          color: themeColors.accent
                        }}>
                          {item.language}
                        </span>
                      </td>
                      <td style={{ padding: "16px", fontWeight: "500", fontSize: "14px", color: themeColors.textPrimary }}>{item.file_name}</td>
                      <td style={{ padding: "16px" }}>
                        <span style={{ 
                          color: item.status === 'completed' ? themeColors.success : themeColors.warning,
                          display: "flex", 
                          alignItems: "center", 
                          gap: "6px", 
                          fontSize: "0.8rem"
                        }}>
                          <span style={{ 
                            width: "8px", 
                            height: "8px", 
                            borderRadius: "50%", 
                            background: item.status === 'completed' ? themeColors.success : themeColors.warning 
                          }}></span>
                          {item.status}
                        </span>
                      </td>
                      <td style={{ padding: "16px" }}>
                        <button 
                          onClick={() => handleExplain(item)}
                          style={{ 
                            padding: '8px 20px', 
                            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '8px', 
                            cursor: 'pointer', 
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'transform 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <FaBrain size={14} /> Explain
                        </button>
                       </td>
                     </tr>
                  ))}
                </tbody>
              </table>
              {data.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px", color: themeColors.textSecondary }}>
                  <FaCode size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p>No files found. Upload some code to get started!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, minHeight: "calc(100vh - 80px)" }}>
            {/* LEFT - CODE EDITOR UI */}
            <div style={{ 
              width: "50%", 
              paddingLeft: "24px",
              paddingRight: "12px",
              paddingBottom: "24px",
              display: "flex", 
              flexDirection: "column", 
              borderRight: `1px solid ${themeColors.border}` 
            }}>
              {/* File Header */}
              <div style={{ 
                padding: "16px 20px", 
                background: themeColors.bgInner,
                borderRadius: "12px",
                marginBottom: "16px",
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaFileAlt color={themeColors.accent} />
                  <span style={{ fontWeight: "600", color: themeColors.textPrimary }}>{selectedCode.file_name}</span>
                </div>
                <button 
                  onClick={() => { setSelectedCode(null); setResult(null); }} 
                  style={{ 
                    background: "transparent", 
                    color: themeColors.danger, 
                    border: `1px solid ${themeColors.danger}`, 
                    padding: "6px 14px", 
                    borderRadius: "8px", 
                    cursor: "pointer",
                    fontSize: "13px",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaArrowLeft size={12} /> Close
                </button>
              </div>
              
              {/* Code Display */}
<div style={{ flex: 1, marginBottom: "20px" }}>

  {/* ✅ SCROLLABLE CODE CONTAINER */}
  <div
    ref={codeRef}
    style={{
      maxHeight: "700px",
      overflowY: "auto",
      background: themeColors.background,
      borderRadius: "12px",
      border: `1px solid ${themeColors.border}`,
      position: "relative"
    }}
  >

    {/* ✅ PROGRESS BAR (NOW INSIDE SCROLL AREA) */}
    {showProgressBar && (
      <div style={{
        position: "sticky",
        top: 0,
        height: "4px",
        width: "100%",
        zIndex: 50,
        overflow: "hidden",
        background: "transparent"
      }}>
        <div style={{
          height: "100%",
          width: `${scrollProgress}%`,
          background: `linear-gradient(
            90deg,
            ${themeColors.accent},
            #00f2fe,
            ${themeColors.accent}
          )`,
          backgroundSize: "200% 100%",
          animation: "progressShimmer 2s linear infinite",
          transition: "width 0.1s linear",
          boxShadow: `0 0 8px ${themeColors.accent}`,
          opacity: isScrolling ? 1 : 0.6,
          borderRadius: "0 4px 4px 0"
        }} />
      </div>
    )}

    {/* ✅ CODE CONTENT */}
    <div style={{ padding: "20px" }}>
      <pre style={{
        margin: 0,
        fontFamily: "'Fira Code', monospace",
        fontSize: "13px",
        lineHeight: "1.6",
        color: themeColors.textPrimary
      }}>
        {selectedCode.code}
      </pre>
    </div>

  </div>

</div>
               
              {/* Optimization Suggestions */}
              {result && (
                <section>
                  <h3 style={{ 
                    fontSize: "1rem", 
                    marginBottom: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    color: themeColors.textPrimary
                  }}>
                    <FaLightbulb style={{ color: themeColors.warning }} /> Optimization Suggestions
                  </h3>

                  {result?.optimizationSuggestions?.length > 0 ? (
                    <div style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "10px",
                      maxHeight: "300px",
                      overflowY: "auto"
                    }}>
                      {formatSuggestions(result.optimizationSuggestions)}
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(72, 187, 120, 0.1)',
                      padding: "15px",
                      borderRadius: "8px",
                      borderLeft: `4px solid ${themeColors.success}`,
                      color: themeColors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaCheckCircle color={themeColors.success} />
                      No major optimization issues detected.
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* RIGHT - ANALYSIS */}
            <div style={{ 
              width: "50%", 
              paddingRight: "24px",
              paddingLeft: "12px",
              paddingBottom: "24px",
              overflow: "auto", 
              background: themeColors.background 
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', marginTop: "100px" }}>
                  <div className="spinner"></div>
                  <p style={{ color: themeColors.textSecondary, marginTop: "20px" }}>
                    <FaBrain style={{ marginRight: '8px' }} />
                    AI is analyzing your code...
                  </p>
                </div>
              ) : result ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                  
                  {/* SUMMARY SECTION */}
                  <section>
                    <h3 style={{ 
                      fontSize: "1rem", 
                      marginBottom: "12px", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px",
                      color: themeColors.textPrimary
                    }}>
                      <span style={{ color: themeColors.accent }}>📝</span> Summary
                    </h3>
                    <div style={{ 
                      background: themeColors.accentGlow, 
                      padding: "20px", 
                      borderRadius: "12px", 
                      borderLeft: `4px solid ${themeColors.accent}`,
                      color: themeColors.textSecondary,
                      lineHeight: "1.6",
                      fontSize: "14px"
                    }}>
                      {result?.summary || 'No summary available.'}
                    </div>
                  </section>

                  {/* METRICS GRID */}
                  <section>
                    <h3 style={{ 
                      fontSize: "1rem", 
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: themeColors.textPrimary
                    }}>
                      <FaChartLine /> Performance Metrics
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                      {[
                        { label: "Lines", val: result?.metrics?.lines, color: themeColors.success, icon: "📄" },
                        { label: "Functions", val: result?.metrics?.functions, color: themeColors.accent, icon: "⚙️" },
                        { label: "Loops", val: result?.metrics?.loops, color: themeColors.warning, icon: "🔄" },
                        { label: "Complexity", val: result?.metrics?.complexity, color: themeColors.danger, icon: "📊" }
                      ].map(m => (
                        <div key={m.label} style={{ 
                          background: themeColors.cardBg, 
                          padding: "16px", 
                          borderRadius: "12px", 
                          textAlign: "center", 
                          border: `1px solid ${themeColors.border}`,
                          transition: 'transform 0.2s'
                        }}>
                          <div style={{ fontSize: "20px", marginBottom: "8px" }}>{m.icon}</div>
                          <span style={{ fontSize: "0.7rem", color: themeColors.textSecondary, display: "block", marginBottom: "5px", textTransform: "uppercase" }}>
                            {m.label}
                          </span>
                          <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: m.color }}>{m.val || 0}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* STEP-BY-STEP LOGIC - FORMATTED */}
                  <section>
                    <h3 style={{ 
                      fontSize: "1rem", 
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: themeColors.textPrimary
                    }}>
                      <FaMicroscope /> Step-by-Step Logic
                    </h3>
                    <div style={{ 
                      background: themeColors.background, 
                      padding: "20px", 
                      borderRadius: "12px", 
                      border: `1px solid ${themeColors.border}`,
                      maxHeight: "400px",
                      overflowY: "auto"
                    }}>
                      {formatExplanationText(result?.explanation)}
                    </div>
                  </section>

                  {/* RAW LINE BREAKDOWN */}
                  {result?.lineByLine && result.lineByLine.length > 0 && (
                    <details style={{ cursor: "pointer" }}>
                      <summary style={{ 
                        padding: "12px", 
                        background: themeColors.accentGlow,
                        borderRadius: "10px", 
                        color: themeColors.textPrimary,
                        fontSize: "14px",
                        fontWeight: "500"
                      }}>
                        🔍 View Raw Line Breakdown
                      </summary>
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px", maxHeight: "300px", overflowY: "auto" }}>
                        {formatLineByLine(result.lineByLine)}
                      </div>
                    </details>
                  )}
                </div>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  marginTop: "100px",
                  color: themeColors.textSecondary
                }}>
                  <FaBrain size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                  <p>Select a file to see AI analysis</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ExplainPage;