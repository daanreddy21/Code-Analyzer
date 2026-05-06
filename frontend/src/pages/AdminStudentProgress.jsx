import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useTheme } from "../context/ThemeContext";

function AdminStudentProgress() {
  const [users, setUsers] = useState([]);
  const [openUser, setOpenUser] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [userGraphs, setUserGraphs] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const { themeColors, theme } = useTheme();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/admin/users-progress");
        setUsers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleUser = async (userId) => {
    if (openUser === userId) {
      setOpenUser(null);
      return;
    }

    setOpenUser(userId);

    try {
      if (!userStats[userId]) {
        const statsRes = await API.get(`/admin/user-stats/${userId}`);
        setUserStats(prev => ({ ...prev, [userId]: statsRes.data }));
      }

      if (!userGraphs[userId]) {
        const graphRes = await API.get(`/admin/user-graph/${userId}`);
        setUserGraphs(prev => ({ ...prev, [userId]: graphRes.data }));
      }

    } catch (err) {
      console.error(err);
    }
  };

  // Styles using themeColors
  const containerStyle = {
    background: themeColors.background,
    minHeight: "100vh",
    color: themeColors.textPrimary,
    padding: "100px",
  };

  const mainContentStyle = {
    maxWidth: "1300px",
    margin: "0 auto",
  };

  const titleStyle = {
    marginBottom: "24px",
    fontSize: "28px",
    fontWeight: "600",
    color: themeColors.textPrimary,
    borderLeft: `4px solid ${themeColors.accent}`,
    paddingLeft: "16px",
  };

  const userCardStyle = (isOpen) => ({
    background: themeColors.cardBg,
    marginBottom: "16px",
    borderRadius: "16px",
    overflow: "hidden",
    transition: "all 0.3s ease",
    border: `1px solid ${themeColors.border}`,
  });

  const userRowStyle = {
    display: "grid",
    gridTemplateColumns: "4fr 1.5fr 1.5fr auto",
    alignItems: "center",
    padding: "20px",
    cursor: "pointer",
    transition: "background 0.2s ease",
  };

  const userNameStyle = {
    fontWeight: "700",
    fontSize: "20px",
    marginBottom: "4px",
    color: themeColors.textPrimary,
  };

  const userEmailStyle = {
    fontSize: "16px",
    color: themeColors.textSecondary,
  };

  const pointsContainerStyle = {
    textAlign: "center",
  };

  const pointsValueStyle = {
    color: themeColors.warning,
    fontWeight: "800",
    fontSize: "20px",
  };

  const pointsLabelStyle = {
    fontSize: "13px",
    color: themeColors.textSecondary,
    marginTop: "4px",
  };

  const levelBadgeStyle = {
    background: `${themeColors.accent}20`,
    color: themeColors.accent,
    padding: "6px 30px 6px 30px",
    borderRadius: "20px",
    fontSize: "18px",
    fontWeight: "600",
    textAlign: "center",
    display: "inline-block",
    width: "fit-content",
  };

  const expandIconStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    color: themeColors.textSecondary,
  };

  const expandedContentStyle = {
    padding: "20px",
    background: themeColors.bgInner,
    borderTop: `1px solid ${themeColors.border}`,
  };

  const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "15px",
    marginBottom: "20px",
  };

  const badgesContainerStyle = {
    marginBottom: "20px",
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  };

  const badgeStyle = {
    background: `${themeColors.accent}20`,
    color: themeColors.accent,
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "500",
  };

  const graphContainerStyle = {
    height: "250px",
    marginTop: "20px",
  };

  const loadingStyle = {
    textAlign: "center",
    padding: "40px",
    color: themeColors.textSecondary,
  };

  const emptyStateStyle = {
    textAlign: "center",
    padding: "60px",
    color: themeColors.textSecondary,
    background: themeColors.cardBg,
    borderRadius: "16px",
    border: `1px solid ${themeColors.border}`,
  };

  const emptyIconStyle = {
    fontSize: "48px",
    marginBottom: "16px",
  };

  return (
    <div style={containerStyle}>
      <div style={mainContentStyle}>
        <h2 style={titleStyle}>📊 Student Progress</h2>

        
        {loading && (
          <div style={loadingStyle}>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              border: `3px solid ${themeColors.border}`,
              borderTop: `3px solid ${themeColors.accent}`,
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 1s linear infinite"
            }} />
            <div>Loading users...</div>
          </div>
        )}

        
        {!loading && users.length === 0 && (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>📭</div>
            <div>No users found</div>
            <div style={{ fontSize: "14px", marginTop: "8px" }}>
              Users will appear here once they start submitting code
            </div>
          </div>
        )}

       
        {!loading && users.map(user => {
          const stats = userStats[user.id] || {};
          const graphData = userGraphs[user.id];
          const isOpen = openUser === user.id;

          return (
            <div key={user.id} style={userCardStyle(isOpen)}>
              {/* MAIN ROW */}
              <div onClick={() => toggleUser(user.id)} style={userRowStyle}
                onMouseEnter={(e) => e.currentTarget.style.background = `${themeColors.accent}10`}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={userNameStyle}>{user.name || "Anonymous User"}</div>
                  <div style={userEmailStyle}>{user.email}</div>
                </div>

                {/* POINTS */}
                <div style={pointsContainerStyle}>
                  <div style={pointsValueStyle}> {user.points || 0}</div>
                  <div style={pointsLabelStyle}>points</div>
                </div>

                {/* LEVEL */}
                <div>
                  <div style={levelBadgeStyle}>{user.level || "Beginner"}</div>
                </div>

                {/* EXPAND ICON */}
                <div style={expandIconStyle}>{isOpen ? "▲" : "▼"}</div>
              </div>

              
              {isOpen && (
                <div style={expandedContentStyle}>
                  {/* STATS CARDS */}
                  <div style={statsGridStyle}>
                    <StatBox 
                      label="Total Scans" 
                      value={stats.totalScans} 
                      icon="📊" 
                      color={themeColors.accent}
                      themeColors={themeColors}
                    />
                    <StatBox 
                      label="Avg Score" 
                      value={`${stats.avgScore ?? 0}%`} 
                      icon="🎯" 
                      color={themeColors.success}
                      themeColors={themeColors}
                    />
                    <StatBox 
                      label="Total Bugs" 
                      value={stats.totalBugs} 
                      icon="🐛" 
                      color={themeColors.danger}
                      themeColors={themeColors}
                    />
                  </div>

                  
                  <div style={badgesContainerStyle}>
                    {user.badges?.length > 0 ? (
                      user.badges.map((b, i) => (
                        <span key={i} style={badgeStyle}>
                          {b}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: themeColors.textSecondary, fontSize: "14px" }}>
                        No badges earned yet
                      </span>
                    )}
                  </div>

                  
                  <div style={graphContainerStyle}>
                    {!graphData ? (
                      <div style={{ textAlign: "center", padding: "40px", color: themeColors.textSecondary }}>
                        <div style={{ 
                          width: "30px", 
                          height: "30px", 
                          border: `2px solid ${themeColors.border}`,
                          borderTop: `2px solid ${themeColors.accent}`,
                          borderRadius: "50%",
                          margin: "0 auto 16px",
                          animation: "spin 1s linear infinite"
                        }} />
                        Loading analytics...
                      </div>
                    ) : graphData.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: themeColors.textSecondary }}>
                        No submission data available
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                          <CartesianGrid stroke={themeColors.border} strokeDasharray="3 3" />
                          <XAxis
                            dataKey="created_at"
                            tickFormatter={(d) => new Date(d).toLocaleDateString()}
                            stroke={themeColors.textSecondary}
                            tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
                          />
                          <YAxis 
                            stroke={themeColors.textSecondary}
                            tick={{ fill: themeColors.textSecondary, fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: themeColors.cardBg,
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: "8px",
                              color: themeColors.textPrimary,
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke={themeColors.accent} 
                            strokeWidth={2}
                            dot={{ r: 4, fill: themeColors.accent, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="bug_count" 
                            stroke={themeColors.danger} 
                            strokeWidth={2}
                            dot={{ r: 4, fill: themeColors.danger, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatBox({ label, value, icon, color, themeColors }) {
  return (
    <div style={{
      background: themeColors.cardBg,
      padding: "15px",
      borderRadius: "12px",
      border: `1px solid ${themeColors.border}`,
      transition: "transform 0.2s ease",
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ 
        fontSize: "12px", 
        color: themeColors.textSecondary,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        marginBottom: "8px"
      }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ 
        fontSize: "28px", 
        fontWeight: "700", 
        color: color || themeColors.textPrimary 
      }}>
        {value ?? 0}
      </div>
    </div>
  );
}

export default AdminStudentProgress;