import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ProjectSubmissionModal from "../pages/ProjectSubmissionModal";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { FaUserCircle, FaSignOutAlt, FaComments, FaBell, FaCode, FaBug, FaChartLine, FaProjectDiagram, FaRocket, FaDownload, FaPlus, FaArrowRight, FaTachometerAlt, FaLightbulb, FaSyncAlt } from "react-icons/fa";
import MessagePopup from "../components/MessagePopup";
import socket from "../services/socket";
import RewardCard from "../components/RewardCard";
import { useTheme } from "../context/ThemeContext";
import { useLocation } from "react-router-dom";

import History from "./History";
import Analyzer from "./Analyzer";
import CodeCompare from "./CodeCompare";
import Profile from "./Profile";
import ChatPage from "./ChatPage";
import FileList from "./FileList";
import ExplainPage from "./ExplainPage";
import CodeRunnerPage from "./CodeRunnerPage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const { themeColors, theme } = useTheme();

  const location = useLocation();

// split path
const segments = location.pathname.split("/").filter(Boolean);

// get LAST route
const last = segments[segments.length - 1];

const renderPage = () => {
  switch (last) {
    case "history":
      return <History />;
    case "analyzer":
      return <Analyzer />;
    case "compare":
      return <CodeCompare />;
    case "profile":
      return <Profile />;
    case "chat":
    case "user":
      return <ChatPage />;
    case "files":
      return <FileList />;
    case "explain":
      return <ExplainPage />;
    case "code-runner":
      return <CodeRunnerPage />;
    default:
      return null;
  }
};



useEffect(() => {
  setCurrentPage(1);
}, [recentScans]);

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
      .then(res => {
        // ✅ Ensure graphData is an array
        if (res.data && Array.isArray(res.data)) {
          setGraphData(res.data);
        } else {
          setGraphData([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch graph data:", err);
        setGraphData([]);
      });
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

    const btnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  background: themeColors.accent,
  color: "#fff",
  cursor: "pointer"
};

    const totalPages = Math.max(1, Math.ceil(recentScans.length / itemsPerPage));

      const startIndex = (currentPage - 1) * itemsPerPage;

      const paginatedScans = recentScans.slice(
        startIndex,
        startIndex + itemsPerPage
    );

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
    } catch (err) { 
      console.error("❌ Dashboard error:", err);
      // ✅ Set default values on error
      setStats({ totalScans: 0, avgScore: 0, totalBugs: 0 });
      setRecentScans([]);
      setProjects([]);
    } finally { 
      setLoading(false); 
    }
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

  // ✅ Sample fallback data for chart when no data exists
  const getFallbackGraphData = () => {
    if (graphData && graphData.length > 0) return graphData;
    // Return sample data for demo
    return [
      { created_at: new Date().toISOString(), score: 0, bug_count: 0 }
    ];
  };

  const displayGraphData = getFallbackGraphData();

  if (loading) {
    return (
      <div className="loading-screen" style={{ background: themeColors.background, color: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ width: '48px', height: '48px', border: `4px solid ${themeColors.accentGlow}`, borderTop: `4px solid ${themeColors.accent}`, borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '20px' }}></div>
        <p style={{ fontSize: '16px', color: themeColors.textSecondary }}>Loading your dashboard...</p>
      </div>
    );
  }

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '8px', padding: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <p style={{ margin: 0, color: themeColors.textSecondary, fontSize: '12px' }}>{new Date(label).toLocaleDateString()}</p>
          <p style={{ margin: '8px 0 0 0', color: payload[0].color }}>{payload[0].name}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-wrapper" style={{ background: themeColors.background, color: themeColors.textPrimary, minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '60px' }}>
      
      {/* Particles Overlay */}
      <div className="particles-bg" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
        {particles.map(p => (
          <div key={p.id} className="particle" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, animationDuration: `${p.speed}s`, background: themeColors.accentGlow, borderRadius: '50%', position: 'absolute' }} />
        ))}
      </div>

      {/* MAIN CONTENT */}
      <main className="dashboard-main" style={{  position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px' }}>
    {last === "dashboard" && (
      <>
        {/* Welcome Section */}
        <div className="welcome-section" style={{ marginBottom: '4px', textAlign: 'center',paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', background: `linear-gradient(135deg, ${theme === 'dark' ? '#fff' : themeColors.textPrimary} 0%, ${themeColors.accent} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '12px' }}>Welcome back, Developer</h1>
          <p style={{ color: themeColors.textSecondary, fontSize: '1.1rem' }}>Track your code quality, analyze trends, and improve your projects</p>
        </div>

        {/* Stats Grid - Professional Cards */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '16px', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ background: `${themeColors.accentGlow}`, padding: '12px', borderRadius: '12px' }}>
                <FaCode size={24} color={themeColors.accent} />
              </div>
              <span style={{ fontSize: '12px', color: themeColors.textSecondary, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '20px' }}>Lifetime</span>
            </div>
            <div className="stat-number" style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '8px' }}>{stats.totalScans?.toLocaleString() || 0}</div>
            <div className="stat-label" style={{ color: themeColors.textSecondary, fontSize: '14px', fontWeight: '500' }}>Total Scans</div>
            <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
              <div style={{ width: stats.totalScans > 0 ? '75%' : '0%', height: '4px', background: themeColors.accent, borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '16px', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(72, 187, 120, 0.1)', padding: '12px', borderRadius: '12px' }}>
                <FaChartLine size={24} color={themeColors.success} />
              </div>
              <span style={{ fontSize: '12px', color: themeColors.textSecondary, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '20px' }}>Average</span>
            </div>
            <div className="stat-number" style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '8px' }}>{stats.avgScore || 0}%</div>
            <div className="stat-label" style={{ color: themeColors.textSecondary, fontSize: '14px', fontWeight: '500' }}>Avg Quality Score</div>
            <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
              <div style={{ width: `${stats.avgScore || 0}%`, height: '4px', background: themeColors.success, borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '16px', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(245, 101, 101, 0.1)', padding: '12px', borderRadius: '12px' }}>
                <FaBug size={24} color={themeColors.danger} />
              </div>
              <span style={{ fontSize: '12px', color: themeColors.textSecondary, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '20px' }}>Total</span>
            </div>
            <div className="stat-number" style={{ fontSize: '42px', fontWeight: 'bold', marginBottom: '8px' }}>{stats.totalBugs?.toLocaleString() || 0}</div>
            <div className="stat-label" style={{ color: themeColors.textSecondary, fontSize: '14px', fontWeight: '500' }}>Bugs Detected</div>
            <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
              <div style={{ width: stats.totalBugs > 0 ? '100%' : '0%', height: '4px', background: themeColors.danger, borderRadius: '2px' }}></div>
            </div>
          </div>
        </div>

        {/* Code Quality Trends - Enhanced Chart */}
        <div className="graph-section" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '20px', padding: '28px', marginBottom: '48px', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ color: themeColors.textPrimary, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}><FaChartLine /> Code Quality Trends</h3>
              <p style={{ color: themeColors.textSecondary, fontSize: '14px', margin: 0 }}>Track your code quality and bug detection over time</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', background: themeColors.accent, borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: themeColors.textSecondary }}>Quality Score</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', background: themeColors.danger, borderRadius: '2px' }}></div>
                <span style={{ fontSize: '12px', color: themeColors.textSecondary }}>Bugs</span>
              </div>
            </div>
          </div>
          
          {/* ✅ Show message when no data */}
          {displayGraphData.length === 0 || (displayGraphData.length === 1 && displayGraphData[0].score === 0) ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 20px',
              color: themeColors.textSecondary,
              background: themeColors.bgInner,
              borderRadius: '12px'
            }}>
              <FaChartLine size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No data available yet. Run some code scans to see your progress!</p>
            </div>
          ) : (
            <div className="graph-container" style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayGraphData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.accent} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={themeColors.accent} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBugs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={themeColors.danger} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={themeColors.danger} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} vertical={false} />
                  <XAxis 
                    dataKey="created_at" 
                    tickFormatter={(d) => d ? new Date(d).toLocaleDateString() : ''} 
                    stroke={themeColors.textSecondary} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={{ stroke: themeColors.border }} 
                  />
                  <YAxis yAxisId="left" stroke={themeColors.textSecondary} fontSize={12} tickLine={false} axisLine={{ stroke: themeColors.border }} />
                  <YAxis yAxisId="right" orientation="right" stroke={themeColors.textSecondary} fontSize={12} tickLine={false} axisLine={{ stroke: themeColors.border }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="score" 
                    stroke={themeColors.accent} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorScore)" 
                    name="Score"
                    dot={{ 
                      r: 4, 
                      fill: themeColors.accent, 
                      stroke: themeColors.background, 
                      strokeWidth: 2,
                      className: "chart-dot"
                    }}
                    activeDot={{ r: 6, fill: themeColors.accent, stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="bug_count" 
                    stroke={themeColors.danger} 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorBugs)" 
                    name="Bugs"
                    dot={{ 
                      r: 4, 
                      fill: themeColors.danger, 
                      stroke: themeColors.background, 
                      strokeWidth: 2,
                      className: "chart-dot"
                    }}
                    activeDot={{ r: 6, fill: themeColors.danger, stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* TWO COLUMN SECTION: Recurring Issues & AI Suggestions - Enhanced */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          {/* Recurring Issues Column */}
          <div style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: themeColors.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><FaSyncAlt /> Recurring Issues</h3>
              {recurringIssues.length > 0 && <span style={{ background: themeColors.danger, color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>{recurringIssues.length} patterns</span>}
            </div>
            {recurringIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', color: themeColors.textSecondary }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                <p style={{ margin: 0 }}>No recurring issues detected</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Your code quality is consistently good!</p>
              </div>
            ) : (
              <ul className="recurring-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recurringIssues.map((issue, index) => (
                  <li key={index} style={{ padding: '16px 0', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="issue-title" style={{ color: themeColors.textPrimary, fontWeight: '500' }}>{issue.title}</span>
                      <div style={{ fontSize: '12px', color: themeColors.textSecondary, marginTop: '4px' }}>Occurs frequently</div>
                    </div>
                    <span className="issue-count" style={{ background: 'rgba(245, 101, 101, 0.1)', color: themeColors.danger, fontWeight: 'bold', padding: '4px 12px', borderRadius: '20px' }}>{issue.count}x</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* AI Suggestions Column */}
          <div style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: themeColors.textPrimary, display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}><FaLightbulb /> AI Suggestions</h3>
              {aiSuggestions.length > 0 && <span style={{ background: themeColors.info, color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>AI powered</span>}
            </div>
            <div className="ai-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {aiSuggestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 24px', color: themeColors.textSecondary }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧠</div>
                  <p style={{ margin: 0 }}>No suggestions yet</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>Run more code scans for personalized insights</p>
                </div>
              ) : (
                aiSuggestions.map((s, i) => (
                  <div key={i} style={{ padding: '16px', borderRadius: '12px', background: `${themeColors.accentGlow}`, border: `1px solid ${themeColors.accentGlow}`, color: themeColors.textPrimary, fontSize: '14px', lineHeight: '1.6' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <FaLightbulb style={{ color: themeColors.accent, marginTop: '2px', flexShrink: 0 }} />
                      <p style={{ margin: 0 }}>{s.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Rewards Dashboard */}
        {rewardData && (
          <div style={{ marginBottom: '2rem' }}>
            <RewardCard data={rewardData} title="🏆 Rewards & Achievements" />
          </div>
        )}

        {/* Recent Scans Table - Enhanced */}
        <div style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '20px', marginBottom: '2rem', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>📋</span>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: themeColors.textPrimary }}>Recent Scans</h3>
            </div>
            <button 
              onClick={() => navigate("/history")} 
              style={{ 
                background: 'transparent', 
                border: `1px solid ${themeColors.border}`, 
                borderRadius: '20px', 
                padding: '0.375rem 1rem', 
                fontSize: '0.75rem',
                cursor: 'pointer', 
                color: themeColors.accent,
                transition: 'all 0.2s'
              }}
            >
              View All →
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.border}`, background: themeColors.cardBg }}>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Language</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>File</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bugs</th>
                  <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: themeColors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentScans.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: themeColors.textSecondary }}>
                      <FaCode size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                      <p>No scans yet. Start analyzing code to see results!</p>
                    </td>
                  </tr>
                ) : (
                  paginatedScans.map(scan => (
                    <tr key={scan.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          background: themeColors.cardBg, 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          color: themeColors.textPrimary
                        }}>{scan.language}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: themeColors.textPrimary }}>{scan.file_name || "Pasted Code"}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          color: scan.score >= 80 ? themeColors.success : (scan.score >= 60 ? themeColors.warning : themeColors.danger), 
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>{scan.score}/100</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem' }}>
                        <span style={{ color: scan.bugs > 0 ? themeColors.danger : themeColors.success }}>{scan.bugs || 0}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: themeColors.textSecondary }}>{new Date(scan.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "10px", 
              marginTop: "20px" 
            }}>
              
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={btnStyle}
              >
                ⬅ Prev
              </button>

              <span style={{ color: themeColors.textSecondary }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={btnStyle}
              >
                Next ➡
              </button>

            </div>
          </div>
        </div>

        {/* Project Submissions Grid - Enhanced */}
        <div className="projects-section" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, borderRadius: '20px', padding: '28px', backdropFilter: 'blur(10px)' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ color: themeColors.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><FaProjectDiagram /> Project Submissions</h3>
              <p style={{ color: themeColors.textSecondary, fontSize: '14px', margin: '8px 0 0 0' }}>Manage and share your college projects</p>
            </div>
            <button className="submit-project-btn" onClick={() => setShowProjectModal(true)} style={{ background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', transition: 'transform 0.2s', boxShadow: `0 4px 12px ${themeColors.accentGlow}` }}><FaPlus size={14} /> New Submission</button>
          </div>
          
          {projects.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '64px 24px', color: themeColors.textSecondary }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📁</div>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>No project submissions yet</p>
              <p style={{ fontSize: '14px' }}>Submit your first college project to showcase your work!</p>
            </div>
          ) : (
            <div className="projects-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {projects.map((project) => (
                <div key={project.id} className="project-card" style={{ background: theme === 'dark' ? 'rgba(15, 15, 26, 0.8)' : 'rgba(240, 240, 255, 0.8)', border: `1px solid ${themeColors.border}`, borderRadius: '16px', padding: '20px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <h4 style={{ color: themeColors.textPrimary, margin: 0, fontSize: '18px', fontWeight: '600' }}>{project.title}</h4>
                    <span style={{ fontSize: '11px', background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`, color: '#fff', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>{project.domain}</span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: themeColors.textSecondary, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ fontWeight: '600' }}>Course:</span> <span style={{ color: themeColors.textPrimary }}>{project.course_name || "N/A"}</span></div>
                    <div style={{ display: 'flex', gap: '8px' }}><span style={{ fontWeight: '600' }}>Stack:</span> <span style={{ color: themeColors.textPrimary }}>{project.tech_stack || "N/A"}</span></div>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: '1.5', color: themeColors.textSecondary, marginBottom: '24px', minHeight: '60px' }}>{project.description}</p>

                  <button onClick={() => handleDownload(project.id, project.title)} style={{ width: '100%', background: `${themeColors.accentGlow}`, border: `1px solid ${themeColors.accent}`, color: themeColors.accent, padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}><FaDownload size={14} /> Download Project</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <br />
      </>
    )}

    {last !== "dashboard" && renderPage()}

      </main>

      <ProjectSubmissionModal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} onSuccess={fetchDashboardData} />
      
      <MessagePopup isOpen={showMessages} onClose={() => setShowMessages(false)} onMarkRead={() => {
        API.get("/notifications").then(res => setUnreadCount(res.data.filter(n => !n.is_read).length));
      }} />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
          border-color: ${themeColors.accent};
        }
        .project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.2);
          border-color: ${themeColors.accent};
        }
        .recent-scans-table tbody tr:hover {
          background: ${themeColors.accentGlow};
        }
        .view-all-btn:hover, .submit-project-btn:hover {
          transform: translateY(-2px);
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          animation: float linear infinite;
          opacity: 0.4;
        }
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh) translateX(20px);
            opacity: 0;
          }
        }
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${themeColors.cardBg};
        }
        ::-webkit-scrollbar-thumb {
          background: ${themeColors.accent};
          borderRadius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #4c51bf;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;