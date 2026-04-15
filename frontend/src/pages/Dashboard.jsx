import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ProjectSubmissionModal from "../pages/ProjectSubmissionModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaUserCircle, FaSignOutAlt, FaComments, FaBell } from "react-icons/fa";
import MessagePopup from "../components/MessagePopup";
import socket from "../services/socket";
import RewardCard from "../components/RewardCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";
  
  const [stats, setStats] = useState({ totalScans: 0, avgScore: 0, totalBugs: 0 });
  const [recentScans, setRecentScans] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [particles, setParticles] = useState([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [recurringIssues, setRecurringIssues] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);  
  const [unread, setUnread] = useState(0);

  // --- LOGIC & EFFECTS (Untouched) ---
  useEffect(() => {
    socket.on("newNotification", () => {
      API.get("/notifications").then(res => {
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      });
    });
    return () => socket.off("newNotification");
  }, []);

  useEffect(() => {
    const closeDropdown = () => setShowDropdown(false);
    window.addEventListener("click", closeDropdown);
    return () => window.removeEventListener("click", closeDropdown);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get("/chat/unread");
        setUnread(res.data.unread);
      } catch (err) { console.error(err); }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!token) return;
    API.get("/code/analysis-history")
      .then(res => setGraphData(res.data))
      .catch(err => setGraphData([]));
  }, [token]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications");
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      } catch (err) { console.error("Failed to fetch notifications count"); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    API.get("/code/recurring-issues").then(res => setRecurringIssues(res.data)).catch(err => console.error(err));
    API.get("/code/ai-suggestions").then(res => setAiSuggestions(res.data)).catch(err => console.error(err));
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.dashboard-header');
      if (window.scrollY > 50) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, recentRes, projectsRes, rewardRes] = await Promise.all([
          API.get("/code/stats"),
          API.get("/code/recent"),
          API.get("/projects/my-submissions"),
          API.get("/rewards")
        ]);
        setStats(statsRes.data);
        setRecentScans(recentRes.data);
        setProjects(projectsRes.data);
        setRewardData(rewardRes.data);
    } catch (err) { console.error("❌ Dashboard error:", err);
    } finally { setLoading(false); }
  };

  const handleDownload = async (projectId, title) => {
    try {
      const response = await API.get(`/projects/download/${projectId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title || 'project'}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) { alert("Unauthorized or file not found."); }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100 - 100,
      size: Math.random() * 3 + 1, speed: Math.random() * 0.3 + 0.1,
    }));
    setParticles(newParticles);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ background: '#0d1117', color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // --- STYLING CONSTANTS ---
  const darkTheme = {
    background: "#021036",
    cardBg: "#02132c",
    border: "#262627",
    textMain: "#c9d1d9",
    textDim: "#8b949e",
    accent: "#58a6ff",
    danger: "#f85149",
    success: "#3fb950"
  };

  return (
    <div className="dashboard-wrapper" style={{ background: darkTheme.background, color: darkTheme.textMain, minHeight: '100vh' }}>
      
      {/* Particles Overlay */}
      <div className="particles-bg">
        {particles.map(p => (
          <div key={p.id} className="particle" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDuration: `${p.speed}s`, background: 'rgba(88, 166, 255, 0.2)' }} />
        ))}
      </div>

      {/* HEADER */}
      <header className="dashboard-header" style={{ background: 'rgba(22, 27, 34, 0.8)', borderBottom: `1px solid ${darkTheme.border}`, backdropFilter: 'blur(10px)' }}>
        <div className="header-content">
          <div className="header-left">
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>AI Code Analyzer</h1>
          </div>

          <div className="header-right">
            <button className="nav-btn" onClick={() => navigate("/dashboard")}>Home</button>
            
            <div style={{ position: "relative" }}>
              <button className="nav-btn" onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}>
                Analyze ▼
              </button>
              {showDropdown && (
                <div style={{ position: "absolute", top: "45px", left: 0, background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, borderRadius: "8px", padding: "8px", minWidth: "200px", zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
                  <div className="dropdown-item" onClick={() => navigate("/analyzer")}>🔍 Code Analyzer</div>
                  <div className="dropdown-item" onClick={() => navigate("/compare")}>⚖️ Compare Code</div>
                  <div className="dropdown-item" onClick={() => navigate("/code-runner")}>▶️ Code Runner</div>
                  <div className="dropdown-item" onClick={() => navigate("/explain")}>📄 Explain Files</div>
                </div>
              )}
            </div>

            <button className="nav-btn" onClick={() => navigate("/history")}>History</button>
            <button className="nav-btn highlight" onClick={() => setShowProjectModal(true)} style={{ background: darkTheme.accent, color: '#fff' }}>Submit Project</button>

            <div className="notification-container" style={{ position: 'relative' }}>
              <button className="nav-btn notification-bell" onClick={() => setShowMessages(true)} style={{ background: unreadCount > 0 ? 'rgba(248,81,73,0.1)' : 'transparent' }}>
                <FaBell size={18} style={{ color: unreadCount > 0 ? darkTheme.danger : darkTheme.textDim }} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: darkTheme.danger, color: 'white', borderRadius: '50%', width: 18, height: 18, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button className="nav-btn profile-btn" onClick={() => navigate("/profile")}><FaUserCircle size={20} /></button>

            <div style={{ position: "relative" }}>
              <button className="nav-btn" onClick={() => navigate("/chat")}><FaComments size={20} /></button>
              {unread > 0 && <span style={{ position: "absolute", top: "-5px", right: "-5px", background: darkTheme.danger, color: "white", borderRadius: "50%", fontSize: "10px", padding: "2px 5px" }}>{unread}</span>}
            </div>

            <button className="nav-btn logout" onClick={logout} style={{ color: darkTheme.danger }}><FaSignOutAlt size={20}/></button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="dashboard-main" style={{ paddingTop: '100px' }}>
        <div className="container">
          <div className="welcome-section" style={{ marginBottom: '40px' }}>
            <h2 style={{ color: '#fff', fontSize: '2rem' }}>Welcome back! 🎯</h2>
            <p style={{ color: darkTheme.textDim }}>Here's what's happening with your code analysis</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid" style={{ gap: '20px', marginBottom: '40px' }}>
            <div className="stat-card" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
              <div className="stat-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
              <div className="stat-number" style={{ fontSize: '32px', fontWeight: 'bold', color: darkTheme.accent }}>{stats.totalScans.toLocaleString()}</div>
              <div className="stat-label" style={{ color: darkTheme.textDim, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Total Scans</div>
            </div>
            <div className="stat-card" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
              <div className="stat-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>🎯</div>
              <div className="stat-number" style={{ fontSize: '32px', fontWeight: 'bold', color: darkTheme.success }}>{stats.avgScore}%</div>
              <div className="stat-label" style={{ color: darkTheme.textDim, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Avg Score</div>
            </div>
            <div className="stat-card" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
              <div className="stat-icon" style={{ fontSize: '24px', marginBottom: '10px' }}>🐛</div>
              <div className="stat-number" style={{ fontSize: '32px', fontWeight: 'bold', color: darkTheme.danger }}>{stats.totalBugs.toLocaleString()}</div>
              <div className="stat-label" style={{ color: darkTheme.textDim, textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Total Bugs</div>
            </div>
          </div>

          {/* Code Quality Graph */}
          <div className="graph-section" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px' }}>📊 Code Quality Trends</h3>
            <div className="graph-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="created_at" tickFormatter={(d) => new Date(d).toLocaleDateString()} stroke={darkTheme.textDim} fontSize={12} />
                  <YAxis stroke={darkTheme.textDim} fontSize={12} />
                  <Tooltip contentStyle={{ background: '#0d1117', border: `1px solid ${darkTheme.border}`, borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="score" stroke={darkTheme.accent} strokeWidth={3} dot={{ fill: darkTheme.accent }} name="Score" />
                  <Line type="monotone" dataKey="bug_count" stroke={darkTheme.danger} strokeWidth={3} dot={{ fill: darkTheme.danger }} name="Bugs" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TWO COLUMN SECTION: Recurring Issues & AI Suggestions */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
            {/* Recurring Issues Column */}
            <div style={{ flex: '1', minWidth: '300px', background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🔁 Recurring Issues</h3>
              {recurringIssues.length === 0 ? (
                <p style={{ color: darkTheme.textDim }}>No recurring issues 🎉</p>
              ) : (
                <ul className="recurring-list" style={{ listStyle: 'none', padding: 0 }}>
                  {recurringIssues.map((issue, index) => (
                    <li key={index} style={{ padding: '12px 0', borderBottom: `1px solid ${darkTheme.border}`, display: 'flex', justifyContent: 'space-between' }}>
                      <span className="issue-title" style={{ color: darkTheme.textMain }}>{issue.title}</span>
                      <span className="issue-count" style={{ color: darkTheme.danger, fontWeight: 'bold' }}>{issue.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* AI Suggestions Column */}
            <div style={{ flex: '1', minWidth: '300px', background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
              <h3 style={{ color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>🧠 AI Suggestions</h3>
              <div className="ai-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiSuggestions.length === 0 ? (
                  <p style={{ color: darkTheme.textDim }}>No suggestions yet</p>
                ) : (
                  aiSuggestions.map((s, i) => (
                    <div key={i} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(88, 166, 255, 0.1)', border: `1px solid rgba(88, 166, 255, 0.2)`, color: darkTheme.textMain, fontSize: '14px' }}>
                      {s.message}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Recent Messages */}
          <div style={{ marginBottom: '40px', padding: '24px', background: 'rgba(22,27,34,0.5)', borderRadius: '12px', border: `1px solid ${darkTheme.border}` }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#fff' }}>🔔 Recent Messages ({unreadCount})</h3>
            {unreadCount === 0 ? (
              <p style={{ color: darkTheme.textDim, margin: 0 }}>No new messages 🎉</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto', color: darkTheme.textMain }}>
                Click the bell icon to view unread notifications.
              </div>
            )}
          </div>

          {/* Rewards Dashboard */}
          {rewardData && (
            <div style={{ marginBottom: "40px" }}>
              <RewardCard data={rewardData} title="🏆 Rewards Dashboard" />
            </div>
          )}

          {/* Recent Scans Table */}
          <div className="recent-scans-section" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px', marginBottom: '40px' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff' }}>📋 Recent Scans</h3>
              <button className="view-all-btn" onClick={() => navigate("/history")} style={{ color: darkTheme.accent, background: 'none', border: 'none', cursor: 'pointer' }}>View All →</button>
            </div>
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="recent-scans-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${darkTheme.border}`, textAlign: 'left' }}>
                    <th style={{ padding: '12px', color: darkTheme.textDim }}>Language</th>
                    <th style={{ padding: '12px', color: darkTheme.textDim }}>File</th>
                    <th style={{ padding: '12px', color: darkTheme.textDim }}>Score</th>
                    <th style={{ padding: '12px', color: darkTheme.textDim }}>Bugs</th>
                    <th style={{ padding: '12px', color: darkTheme.textDim }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map(scan => (
                    <tr key={scan.id} style={{ borderBottom: `1px solid ${darkTheme.border}` }}>
                      <td style={{ padding: '12px' }}><span style={{ padding: '4px 8px', borderRadius: '4px', background: '#30363d', fontSize: '12px' }}>{scan.language}</span></td>
                      <td style={{ padding: '12px' }}>{scan.file_name || "Pasted Code"}</td>
                      <td style={{ padding: '12px' }}><span style={{ color: scan.score >= 80 ? darkTheme.success : darkTheme.danger, fontWeight: 'bold' }}>{scan.score}/100</span></td>
                      <td style={{ padding: '12px' }}><span style={{ color: scan.bugs > 0 ? darkTheme.danger : darkTheme.success }}>{scan.bugs || 0}</span></td>
                      <td style={{ padding: '12px', color: darkTheme.textDim }}>{new Date(scan.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Project Submissions Grid */}
          <div className="projects-section" style={{ background: darkTheme.cardBg, border: `1px solid ${darkTheme.border}`, padding: '24px', borderRadius: '12px' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: '#fff' }}>📁 Project Submissions</h3>
              <button className="submit-project-btn" onClick={() => setShowProjectModal(true)} style={{ background: darkTheme.success, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>➕ New Submission</button>
            </div>
            
            {projects.length === 0 ? (
              <div className="empty-state" style={{ textAlign: 'center', padding: '40px', color: darkTheme.textDim }}>
                <p>No project submissions yet. Submit your first college project!</p>
              </div>
            ) : (
              <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {projects.map((project) => (
                  <div key={project.id} className="project-card" style={{ background: '#0d1117', border: `1px solid ${darkTheme.border}`, padding: '20px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h4 style={{ color: '#fff', margin: 0 }}>{project.title}</h4>
                      <span style={{ fontSize: '10px', background: darkTheme.accent, color: '#fff', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>{project.domain}</span>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: darkTheme.textDim, display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' }}>
                      <div>Course: <span style={{ color: darkTheme.textMain }}>{project.course_name || "N/A"}</span></div>
                      <div>Stack: <span style={{ color: darkTheme.textMain }}>{project.tech_stack || "N/A"}</span></div>
                    </div>

                    <p style={{ fontSize: '14px', height: '60px', overflow: 'hidden', color: darkTheme.textMain, marginBottom: '20px' }}>{project.description}</p>

                    <button onClick={() => handleDownload(project.id, project.title)} style={{ width: '100%', background: 'transparent', border: `1px solid ${darkTheme.accent}`, color: darkTheme.accent, padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Download Zip</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <ProjectSubmissionModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} onSuccess={fetchDashboardData} />
      
      <MessagePopup isOpen={showMessages} onClose={() => setShowMessages(false)} onMarkRead={() => {
        API.get("/notifications").then(res => setUnreadCount(res.data.filter(n => !n.is_read).length));
      }} />

      <footer className="dashboard-footer" style={{ borderTop: `1px solid ${darkTheme.border}`, marginTop: '60px', background: darkTheme.cardBg, padding: '40px 0' }}>
        <div className="footer-content" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '30px' }}>
          <div className="footer-brand">
            <h3 style={{ color: '#fff' }}>🚀 AI Code Analyzer</h3>
            <p style={{ color: darkTheme.textDim }}>Analyze, optimize & improve your code using AI</p>
          </div>
          <div className="footer-links" style={{ display: 'flex', gap: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ color: '#fff', fontSize: '14px' }}>Quick Links</h4>
              <a href="/analyzer" style={{ color: darkTheme.textDim, textDecoration: 'none', fontSize: '14px' }}>Analyze Code</a>
              <a href="/history" style={{ color: darkTheme.textDim, textDecoration: 'none', fontSize: '14px' }}>History</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ color: '#fff', fontSize: '14px' }}>Connect</h4>
              <a href="#" style={{ color: darkTheme.textDim, textDecoration: 'none', fontSize: '14px' }}>GitHub</a>
              <a href="#" style={{ color: darkTheme.textDim, textDecoration: 'none', fontSize: '14px' }}>LinkedIn</a>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px', color: darkTheme.textDim, fontSize: '12px' }}>
          © 2026 AI Code Analyzer • Built with ❤️ for developers
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;