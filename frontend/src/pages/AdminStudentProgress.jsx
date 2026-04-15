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

function AdminStudentProgress() {
  const [users, setUsers] = useState([]);
  const [openUser, setOpenUser] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [userGraphs, setUserGraphs] = useState({});
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const navigate = useNavigate();

  const theme = {
    bg: "#0f172a",
    card: "#1e293b",
    inner: "#020617",
    border: "#334155",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    accent: "#22c55e",
    danger: "#ef4444",
  };

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

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleUser = async (userId) => {
    if (openUser === userId) {
      setOpenUser(null);
      return;
    }

    setOpenUser(userId);

    try {
      // ✅ cache optimization
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

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", color: theme.textMain }}>
      
      {/* HEADER */}
      <header style={{
        background: theme.card,
        borderBottom: `1px solid ${theme.border}`,
        padding: "0 30px",
        height: "70px",
        display: "flex",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: "700" }}>🛠 Admin Control</h1>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button onClick={() => navigate("/chat")} className="nav-btn">💬 Chat</button>
            <button onClick={() => navigate("/admin/students")} className="nav-btn">Students</button>
            <button onClick={() => navigate("/admin/profile")} className="nav-btn">👤 Profile</button>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div style={{ maxWidth: "1300px", margin: "40px auto", padding: "0 20px" }}>
        <h2 style={{ marginBottom: "24px" }}>📊 Student Progress</h2>

        {/* LOADING */}
        {loading && <div>Loading users...</div>}

        {/* EMPTY */}
        {!loading && users.length === 0 && (
          <div style={{ color: theme.textMuted }}>No users found</div>
        )}

        {/* USERS */}
        {!loading && users.map(user => {
          const stats = userStats[user.id] || {};
          const graphData = userGraphs[user.id];
          const isOpen = openUser === user.id;

          return (
            <div key={user.id} style={{
              background: theme.card,
              marginBottom: "16px",
              borderRadius: "16px",
              border: `1px solid ${isOpen ? theme.accent : theme.border}`,
              overflow: "hidden"
            }}>

              {/* MAIN ROW */}
              <div
                onClick={() => toggleUser(user.id)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "4fr 1.5fr 1.5fr auto",
                  alignItems: "center",
                  padding: "20px",
                  cursor: "pointer"
                }}
              >
                <div>
                  <div style={{ fontWeight: "600" }}>{user.name}</div>
                  <div style={{ fontSize: "18px", color: theme.textMuted }}>{user.email}</div>
                </div>

                {/* POINTS */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    color: "#fbbf24",
                    fontWeight: "800",
                    fontSize: "20px"
                    }}>
                    ⭐ {user.points}
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                        points
                    </div>
                    </div>
                  
                </div>

                {/* LEVEL */}
                <div style={{
                  background: "#22c55e22",
                  color: theme.accent,
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "15px",
                  fontWeight: "600",
                  textAlign: "center"
                }}>
                  🎯 {user.level}
                </div>
               

                <div style={{ fontSize: "18px" }}>
                  {isOpen ? "<" : ">"}
                </div>
              </div>

              {/* EXPANDED */}
              {isOpen && (
                <div style={{
                  padding: "20px",
                  background: theme.inner,
                  borderTop: `1px solid ${theme.border}`
                }}>

                  {/* STATS */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "15px",
                    marginBottom: "20px"
                  }}>
                    <StatBox label="Total Scans" value={stats.totalScans} icon="📊" />
                    <StatBox label="Avg Score" value={`${stats.avgScore ?? 0}%`} icon="🎯" color={theme.accent} />
                    <StatBox label="Bugs" value={stats.totalBugs} icon="🐛" color={theme.danger} />
                  </div>

                  {/* BADGES */}
                  <div style={{ marginBottom: "20px" }}>
                    {user.badges?.length > 0 ? user.badges.map((b, i) => (
                      <span key={i} style={{
                        background: "#22c55e22",
                        color: theme.accent,
                        padding: "5px 10px",
                        borderRadius: "20px",
                        marginRight: "8px"
                      }}>
                        🏆 {b}
                      </span>
                    )) : "No badges"}
                  </div>

                  {/* GRAPH */}
                  <div style={{ height: "250px" }}>
                    {!graphData ? (
                      <div>Loading analytics...</div>
                    ) : graphData.length === 0 ? (
                      <div>No data available</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                          <CartesianGrid stroke="#334155" />
                          <XAxis
                            dataKey="created_at"
                            tickFormatter={(d) => new Date(d).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#22c55e" />
                          <Line type="monotone" dataKey="bug_count" stroke="#ef4444" />
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
        .nav-btn {
          background: #334155;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
        }
        .nav-btn:hover { background: #475569; }
        .logout-btn {
          border: 1px solid #ef4444;
          color: #ef4444;
          padding: 8px 16px;
          border-radius: 8px;
          background: transparent;
          cursor: pointer;
        }
      `}</style>
      {/* 🔻 FOOTER */}
<footer style={{
  marginTop: "150px",
  padding: "20px",
  textAlign: "center",
  borderTop: `1px solid ${theme.border}`,
  color: theme.textMuted,
  fontSize: "13px"
}}>
  © {new Date().getFullYear()} AI Code Analyzer • Admin Portal • Internal Use Only
</footer>
    </div>
  );
}

function StatBox({ label, value, icon, color }) {
  return (
    <div style={{
      background: "#1e293b",
      padding: "15px",
      borderRadius: "12px"
    }}>
      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "24px", fontWeight: "700", color: color || "white" }}>
        {value ?? 0}
      </div>
    </div>
  );
}

export default AdminStudentProgress;