import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client"; // 🔥 ADD HERE

function AdminDashboard() {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [unread, setUnread] = useState(0); // chat unread
  const [notifUnread, setNotifUnread] = useState(0); // notifications
  const [activeBookmarkMenu, setActiveBookmarkMenu] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const socket = React.useMemo(() => io("http://localhost:5000"), []);
  // State to handle the text input for rejection reasons per row
  const [rejectReasons, setRejectReasons] = useState({});

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
  socket.on("new_comment", (comment) => {
    setComments((prev) => [...prev, comment]);
  });

  return () => socket.off("new_comment");
}, []);

useEffect(() => {
  const fetchCounts = async () => {
    try {
      const chatRes = await API.get("/chat/unread");
      setUnread(chatRes.data.unread);

      const notifRes = await API.get("/notifications/unread");
      setNotifUnread(notifRes.data.unread);
    } catch (err) {
      console.error(err);
    }
  };

  fetchCounts();
  const interval = setInterval(fetchCounts, 8000);

  return () => clearInterval(interval);
}, []);

  // 🔒 Protect admin route
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // 🔹 Fetch submissions based on filter
const fetchSubmissions = async (status) => {
  try {
    setLoading(true);

    let url = `/admin/submissions?status=${status}`;

    if (status === "bookmarks") {
      url = `/admin/submissions?bookmarked=true`;
    }

    const res = await API.get(url);
    setSubmissions(res.data);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};


// 🔹 Toggle user notifications
const toggleNotifications = async (userId) => {
  try {
    await API.put(`/admin/users/${userId}/notifications`);
    alert("🔔 Notification settings updated!");
    fetchSubmissions(filter); // Refresh table
  } catch (err) {
    console.error(err);
    alert("Failed to update");
  }
};

  useEffect(() => {
    fetchSubmissions(filter);
  }, [filter]);

   const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };  

  // 🔹 View code
const handleView = async (id) => {
  try {
    const res = await API.get(`/admin/submission/${id}`);

    socket.emit("join_submission", id); // 🔥 ADD HERE

    setSelectedCode({
      ...res.data,
      id: id   // 🔥 ensures id always exists
    });

    // 🔥 ADD THIS
    const commentRes = await API.get(`/comments/${id}`);
    setComments(commentRes.data);

  } catch (err) {
    console.error(err);
  }
};

// 🔥 NEW: COMMENT FUNCTION
const addComment = async () => {
  if (!newComment.trim()) return;

  console.log("ADMIN sending ID:", selectedCode.id);

  try {
    await API.post("/comments", {
      submissionId: selectedCode.id, // ✅ FIXED
      comment: newComment
    });

    setNewComment("");

    const res = await API.get(`/comments/${selectedCode.id}`);
    setComments(res.data);

  } catch (err) {
    alert("Failed to add comment");
  }
};

  // 🔹 Approve
  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/approve/${id}`);
      alert("✅ Approved!");
      fetchSubmissions(filter);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Reject
  const handleReject = async (id) => {
    const reason = rejectReasons[id];

    if (!reason || reason.trim() === "") {
      alert("Please enter a rejection reason");
      return;
    }

    try {
      await API.put(`/admin/reject/${id}`, { reason });
      alert("❌ Rejected!");
      setRejectReasons({ ...rejectReasons, [id]: "" });
      fetchSubmissions(filter);
    } catch (err) {
      console.error(err);
    }
  };

  // --- STYLES ---
  const containerStyle = { minHeight: "100vh", paddingTop: "120px", display: "flex", flexDirection: "column", background: "#0a0f1e", color: "#fff", fontFamily: "'Inter', sans-serif" };
  const cardStyle = { background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(20px)", borderRadius: "24px", padding: "2.5rem", boxShadow: "0 25px 50px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", maxWidth: "1300px", margin: "0 auto 80px auto", width: "95%" };
  const tableStyle = { width: "100%", borderCollapse: "separate", borderSpacing: "0 10px" };
  const tdStyle = { padding: "18px 20px", background: "rgba(255, 255, 255, 0.03)", color: "#e2e8f0" };
  const filterBtn = (active) => ({ padding: "10px 20px", borderRadius: "8px", border: "none", cursor: "pointer", background: active ? "linear-gradient(135deg, #00c6ff, #0072ff)" : "rgba(255,255,255,0.1)", color: "white", fontWeight: "600", marginRight: "10px", transition: "0.3s" });

  return (
    <div style={containerStyle}>
      <style>{`
        .dashboard-header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 14px 0; background: rgba(10, 15, 30, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
        .header-content { max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; }
        .nav-btn { background: transparent; color: #cbd5e0; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .nav-btn:hover { background: rgba(255,255,255,0.1); color: white; }
        .dashboard-footer { background: #070b14; border-top: 1px solid rgba(255,255,255,0.1); padding: 50px 0 20px 0; margin-top: auto; }
      `}</style>

      {/* HEADER */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left"><h1>🛠 Admin Control</h1></div>
         <div className="header-right" style={{ display: "flex", gap: "15px", alignItems: "center" }}>

            {/* 💬 CHAT */}
            <div style={{ position: "relative" }}>
              <button className="nav-btn" onClick={() => navigate("/chat")}>
                💬 Chat-M
              </button>

              {unread > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "#22c55e",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "10px",
                  padding: "3px 6px"
                }}>
                  {unread}
                </span>
              )}
            </div>
          <button className="nav-btn" onClick={() => navigate("/admin/students")}>
             Students
          </button>

            {/* 👤 PROFILE */}
            <button className="nav-btn" onClick={() => navigate("/admin/profile")}>
              👤 Profile
            </button>

            {/* 🚪 LOGOUT */}
            <button 
              className="nav-btn logout" 
              onClick={logout} 
              style={{ color: '#ff4d4d' }}
            >
              Logout
            </button>

          </div>
        </div>
      </header>

      <div style={cardStyle}>
        <h2 style={{ marginBottom: "20px" }}>Submissions Management</h2>

        {/* FILTER TABS */}
        <div style={{ marginBottom: "30px" }}>
          {["pending", "approved", "rejected", "all", "bookmarks"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={filterBtn(filter === f)}>
              {f === "bookmarks" ? "⭐ Bookmarks" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading Submissions...</p>
        ) : submissions.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', color: '#94a3b8'}}>🎉 No submissions found for this filter.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ color: "#94a3b8", textAlign: "left" }}>
                  <th style={{ padding: "0 20px" }}>File & User</th>
                  <th>Language</th>
                  <th>Status</th>
                  {/* 🔥 REJECTION REASON HEADER */}
                  {filter === "rejected" && <th>Rejection Reason</th>}
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((item) => (
                  <tr key={item.id}>
                    <td style={{ ...tdStyle, borderTopLeftRadius: "15px", borderBottomLeftRadius: "15px" }}>
                      <div style={{ fontWeight: "bold" }}>{item.file_name}</div>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>by {item.user_name}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: "rgba(0,198,255,0.1)", color: "#00c6ff", padding: "4px 8px", borderRadius: "4px", fontSize: "12px" }}>{item.language}</span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ 
                        color: item.status === "pending" ? "#f59e0b" : item.status === "approved" ? "#10b981" : "#ef4444",
                        fontSize: '13px', fontWeight: 'bold'
                      }}>
                        ● {item.status.toUpperCase()}
                      </span>
                    </td>

                    {/* 🔥 REJECTION REASON CELL */}
                    {filter === "rejected" && (
                      <td style={{ ...tdStyle, color: "#fca5a5", fontStyle: "italic", fontSize: "14px" }}>
                        {item.rejection_reason || "No reason specified"}
                      </td>
                    )}

                    <td style={{ ...tdStyle, borderTopRightRadius: "15px", borderBottomRightRadius: "15px", textAlign: "right" }}>
                      <button
                        onClick={async () => {
                          try {
                            const res = await API.put(`/admin/bookmark/${item.id}`);
                            alert(res.data.message); // shows bookmarked message
                            fetchSubmissions(filter);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          background: item.is_bookmarked ? "#facc15" : "transparent",
                          border: "1px solid #facc15",
                          color: "#facc15",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          marginRight: "10px"
                        }}
                      >
                        ⭐
                      </button>
                      <button onClick={() => handleView(item.id)} style={{ background: "none", border: "1px solid #4a5568", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "10px" }}>View</button>
                      
                      {item.status === "pending" && (
                        <>
                          <button onClick={() => handleApprove(item.id)} style={{ background: "#10b981", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", marginRight: "10px" }}>Approve</button>
                          <input 
                            type="text" placeholder="Reason..." 
                            value={rejectReasons[item.id] || ""} 
                            onChange={(e) => setRejectReasons({ ...rejectReasons, [item.id]: e.target.value })} 
                            style={{ padding: "6px", borderRadius: "6px", border: "1px solid #4a5568", background: "#1a202c", color: "#fff", width: "120px", marginRight: "5px" }}
                          />
                          <button onClick={() => handleReject(item.id)} style={{ background: "#ef4444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            <p>© 2026 AI Code Analyzer • Admin Portal • Internal Use Only</p>
          </div>
        </div>
      </footer>

      {/* CODE VIEW MODAL */}
      {selectedCode && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }} onClick={() => setSelectedCode(null)}>
          <div style={{ background: "#1a202c", padding: "30px", borderRadius: "20px", width: "90%", maxWidth: "900px", border: "1px solid rgba(255,255,255,0.1)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "15px", color: "#fff" }}>{selectedCode.file_name}</h3>
            <pre style={{ background: "#0a0f1e", color: "#00ff99", padding: "20px", borderRadius: "10px", maxHeight: "60vh", overflow: "auto", fontFamily: "monospace", fontSize: "14px" }}>
              {selectedCode.code}
            </pre>
            {/* 💬 COMMENTS */}
              <div style={{
                marginTop: "20px",
                background: "#0f172a",
                padding: "15px",
                borderRadius: "12px",
                maxHeight: "200px",
                overflowY: "auto"
              }}>
                <h3 style={{ color: "#fff", marginBottom: "10px" }}>💬 Comments</h3>

                {comments.length === 0 ? (
                  <p style={{ color: "#94a3b8" }}>No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} style={{
                      padding: "8px",
                      marginBottom: "8px",
                      background: "#1e293b",
                      borderRadius: "8px"
                    }}>
                      <strong style={{ color: c.role === "admin" ? "#f87171" : "#60a5fa" }}>
                        {c.name}
                      </strong>
                      <p style={{ margin: "4px 0", color: "#e2e8f0" }}>
                        {c.comment}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* ✍️ ADMIN REPLY */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <input
                  type="text"
                  placeholder="Reply to user..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                    background: "#1e293b",
                    color: "#fff"
                  }}
                />
                <button
                  onClick={addComment}
                  style={{
                    background: "#ef4444",
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
            <button onClick={() => setSelectedCode(null)} style={{ marginTop: "20px", padding: "10px 20px", background: "#4a5568", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>Close Preview</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;