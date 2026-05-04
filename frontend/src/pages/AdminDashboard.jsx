import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { useTheme } from "../context/ThemeContext";

function AdminDashboard() {
  const navigate = useNavigate();
  const { themeColors, theme } = useTheme();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [submissions, setSubmissions] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [rejectReasons, setRejectReasons] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const socket = React.useMemo(() => io("http://localhost:5000"), []);

  const user = JSON.parse(localStorage.getItem("user"));

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showProgressBar, setShowProgressBar] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const codeViewerRef = useRef(null);
  const scrollTimeout = useRef(null);

  const onEmojiClick = (emojiData) => {
    setNewComment((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, sortBy]);

  useEffect(() => {
    socket.on("new_comment", (comment) => {
      setComments((prev) => [...prev, comment]);
    });
    return () => socket.off("new_comment");
  }, [socket]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

useEffect(() => {
  const el = codeViewerRef.current;
  if (!el) return;

  const handler = () => handleScroll();

  el.addEventListener("scroll", handler);

  return () => el.removeEventListener("scroll", handler);
}, [selectedCode]);

  const handleScroll = () => {
  const el = codeViewerRef.current;
  if (!el) return;

  const scrollTop = el.scrollTop;
  const scrollHeight = el.scrollHeight;
  const clientHeight = el.clientHeight;

    if (scrollHeight <= clientHeight + 5) {
      setShowProgressBar(false);
      return;
    }

  setShowProgressBar(true);

  const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
  setScrollProgress(progress);

  setIsScrolling(true);

  clearTimeout(scrollTimeout.current);
  scrollTimeout.current = setTimeout(() => {
    setIsScrolling(false);
  }, 1000);
};

const fetchSubmissions = async (status) => {
  try {
    setLoading(true);

    let url = `/admin/submissions?status=${status}`;

    // ✅ FIX: handle "bookmarks/Pinned"
    if (status === "bookmarks/Pinned") {
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

  useEffect(() => {
    fetchSubmissions(filter);
  }, [filter]);

  const handleView = async (id) => {
    try {
      const res = await API.get(`/admin/submission/${id}`);
      socket.emit("join_submission", id);

      setSelectedCode({ ...res.data, id });

      // ✅ ADD THIS
      setScrollProgress(0);
      setShowProgressBar(false);
      setIsScrolling(false);

      const commentRes = await API.get(`/comments/${id}`);
      setComments(commentRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await API.post("/comments", {
        submissionId: selectedCode.id,
        comment: newComment,
      });
      setNewComment("");
      const res = await API.get(`/comments/${selectedCode.id}`);
      setComments(res.data);
    } catch {
      alert("Failed to add comment");
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/approve/${id}`);
      fetchSubmissions(filter);
    } catch (err) {
      alert("Failed to approve submission");
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReasons[id];
    if (!reason) return alert("Enter rejection reason");
    try {
      await API.put(`/admin/reject/${id}`, { reason });
      fetchSubmissions(filter);
    } catch (err) {
      alert("Failed to reject submission");
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return themeColors.success;
      case 'rejected': return themeColors.danger;
      case 'pending': return themeColors.warning;
      default: return themeColors.textSecondary;
    }
  };

  const getStatusBadgeStyle = (status) => ({
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: getStatusColor(status) + '20',
    color: getStatusColor(status),
    border: `1px solid ${getStatusColor(status)}40`
  });

  const filteredSubmissions = submissions.filter(sub => {
    if (!sub) return false;
    const fileName = (sub.file_name || "").toLowerCase();
    const search = (searchTerm || "").toLowerCase();
    return fileName.includes(search);
  });

const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
  // ⭐ STEP 1: PINNED FIRST
  if (a.is_bookmarked && !b.is_bookmarked) return -1;
  if (!a.is_bookmarked && b.is_bookmarked) return 1;

  // ⭐ STEP 2: NORMAL SORT
  if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
  if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);

  return 0;
});

  
  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedSubmissions.length / itemsPerPage));

    const startIndex = (currentPage - 1) * itemsPerPage;

    const paginatedSubmissions = sortedSubmissions.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  // Styles using themeColors
  const containerStyle = {
    minHeight: "100vh",
    padding: "40px 20px",
    background: themeColors.background,
    color: themeColors.textPrimary,
  };

  const toggleBookmark = async (id) => {
  try {
    await API.put(`/admin/bookmark/${id}`);
    fetchSubmissions(filter); // refresh
  } catch (err) {
    console.error("Bookmark failed");
  }
};

// const togglePin = async (id) => {
//   try {
//     await API.put(`/admin/pin/${id}`);
//     fetchSubmissions(filter); // refresh
//   } catch (err) {
//     console.error("Pin failed");
//   }
// };

  const cardStyle = {
    background: themeColors.cardBg,
    borderRadius: "20px",
    padding: "30px",
    border: `1px solid ${themeColors.border}`,
    boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(0,0,0,0.1)",
    maxWidth: "1400px",
    margin: "0 auto",
  };

  const filterBtn = (active) => ({
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    background: active ? `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` : themeColors.bgInner,
    color: active ? "#fff" : themeColors.textSecondary,
    cursor: "pointer",
    marginRight: "10px",
    marginBottom: "10px",
    fontWeight: "500",
    transition: "all 0.3s ease",
  });

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(5px)",
  };

  const modalContentStyle = {
    background: themeColors.cardBg,
    borderRadius: "20px",
    padding: "30px",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "80vh",
    overflow: "auto",
    position: "relative",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
    border: `1px solid ${themeColors.border}`,
  };

  const buttonStyle = {
    primary: {
      background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      margin: "0 4px",
      transition: "transform 0.2s",
    },
    secondary: {
      background: themeColors.bgInner,
      color: themeColors.textPrimary,
      border: `1px solid ${themeColors.border}`,
      padding: "8px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      margin: "0 4px",
    },
    danger: {
      background: `linear-gradient(135deg, ${themeColors.danger}, #dc2626)`,
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      margin: "0 4px",
    },
    success: {
      background: `linear-gradient(135deg, ${themeColors.success}, #059669)`,
      color: "white",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      margin: "0 4px",
    },
  };

  const paginationBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: `1px solid ${themeColors.border}`,
  background: themeColors.bgInner,
  color: themeColors.textPrimary,
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "500",
  transition: "all 0.2s ease"
};

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ maxWidth: "1300px", margin: "0 auto 30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h1 style={{ 
              color: themeColors.textPrimary, 
              fontSize: "2.5rem", 
              margin: "0 0 10px 0",
              background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: themeColors.textSecondary, margin: 0 }}>
              Welcome back, {user?.name || "Admin"}! Manage and review code submissions
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto 30px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px"
      }}>
        <StatCard 
          icon="📊" 
          title="Total Submissions" 
          value={submissions.length} 
          color={themeColors.accent}
          themeColors={themeColors}
          theme={theme}
        />
        <StatCard 
          icon="⏳" 
          title="Pending" 
          value={submissions.filter(s => s.status === "pending").length} 
          color={themeColors.warning}
          themeColors={themeColors}
          theme={theme}
        />
        <StatCard 
          icon="✅" 
          title="Approved" 
          value={submissions.filter(s => s.status === "approved").length} 
          color={themeColors.success}
          themeColors={themeColors}
          theme={theme}
        />
        <StatCard 
          icon="❌" 
          title="Rejected" 
          value={submissions.filter(s => s.status === "rejected").length} 
          color={themeColors.danger}
          themeColors={themeColors}
          theme={theme}
        />
      </div>

      {/* Main Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "15px" }}>
          <h2 style={{ margin: 0, color: themeColors.textPrimary }}>Submissions Manager</h2>
          
          {/* Search and Sort */}
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              placeholder="🔍 Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: `1px solid ${themeColors.border}`,
                background: themeColors.bgInner,
                color: themeColors.textPrimary,
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: `1px solid ${themeColors.border}`,
                background: themeColors.bgInner,
                color: themeColors.textPrimary,
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: "25px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {["pending", "approved", "rejected", "all", "bookmarks/Pinned"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={filterBtn(filter === f)}>
              {f === "bookmarks/Pinned"
                ? "📌 Pinned"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}>
            <div style={{ 
              width: "50px", 
              height: "50px", 
              border: `3px solid ${themeColors.accent}30`,
              borderTop: `3px solid ${themeColors.accent}`,
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite"
            }} />
            <p style={{ color: themeColors.textSecondary }}>Loading submissions...</p>
          </div>
        ) : sortedSubmissions.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px",
            color: themeColors.textSecondary
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "20px" }}>📭</div>
            <h3 style={{ color: themeColors.textPrimary }}>No submissions found</h3>
            <p>Try switching filters or wait for new uploads</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                  <th style={{ textAlign: "left", padding: "12px", color: themeColors.textSecondary }}>File Name</th>
                  <th style={{ textAlign: "left", padding: "12px", color: themeColors.textSecondary }}>Status</th>
                  <th style={{ textAlign: "left", padding: "12px", color: themeColors.textSecondary }}>Submitted By</th>
                  <th style={{ textAlign: "left", padding: "12px", color: themeColors.textSecondary }}>Date</th>
                  <th style={{ textAlign: "left", padding: "12px", color: themeColors.textSecondary }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      background: item.is_bookmarked ? "rgba(245, 158, 11, 0.08)" : "transparent",
                      borderLeft: item.is_bookmarked ? "4px solid #f59e0b" : "none"
                    }}
                  >
                    <td style={{ padding: "12px", color: themeColors.textPrimary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>📄</span>
                        {item.file_name || "Unknown File"}
                        {item.is_bookmarked && (
                          <span style={{ marginLeft: "6px", color: "#f59e0b" }}>
                            📌
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={getStatusBadgeStyle(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px", color: themeColors.textSecondary }}>{item.user_name || "Anonymous"}</td>
                    <td style={{ padding: "12px", color: themeColors.textSecondary }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button onClick={() => handleView(item.id)} style={buttonStyle.primary}>
                        View Code
                      </button>
                         {/* ⭐ PIN BUTTON (ADD HERE) */}
                      <button
                        onClick={() => toggleBookmark(item.id)}
                        style={{
                          background: item.is_bookmarked ? "#f59e0b" : "#2d3748",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "none",
                          cursor: "pointer",
                          marginLeft: "6px"
                        }}
                      >
                        {item.is_bookmarked ? "📌 Unpin" : "⭐ Pin"}
                      </button> 
                      {item.status === "pending" && (
                        <>
                          <button onClick={() => handleApprove(item.id)} style={buttonStyle.success}>
                            Approve
                          </button>
                          <input
                            placeholder="Rejection reason"
                            onChange={(e) =>
                              setRejectReasons({ ...rejectReasons, [item.id]: e.target.value })
                            }
                            style={{
                              padding: "6px 10px",
                              margin: "0 4px",
                              borderRadius: "6px",
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.bgInner,
                              color: themeColors.textPrimary,
                              width: "150px",
                            }}
                          />
                          <button onClick={() => handleReject(item.id)} style={buttonStyle.danger}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedSubmissions.length > 0 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: "10px", 
                marginTop: "20px" 
              }}>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                      ...paginationBtnStyle,
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                >
                  ⬅ Prev
                </button>

                <span style={{ color: themeColors.textSecondary }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage >= totalPages}
                  style={buttonStyle.secondary}
                >
                  Next ➡
                </button>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedCode && (
        <div onClick={() => setSelectedCode(null)} style={modalOverlayStyle}>
          <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
            {/* Modal Header */}
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: `1px solid ${themeColors.border}`
            }}>
              <h3 style={{ margin: 0, color: themeColors.textPrimary }}>Code Review</h3>
              <button 
                onClick={() => setSelectedCode(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: themeColors.textSecondary,
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Code Content */}
            <div style={{ position: "relative", marginBottom: "20px" }}>

              {/* ✅ PROGRESS BAR */}
              {showProgressBar && (
                <div style={{
                  position: "sticky",
                  top: 0,
                  height: "5px",
                  width: "100%",
                  zIndex: 20,
                  overflow: "hidden"
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
                    animation: isScrolling ? "progressShimmer 2s linear infinite" : "none",
                    transition: "width 0.15s ease-out",
                    boxShadow: `0 0 8px ${themeColors.accent}`,
                    borderRadius: "0 4px 4px 0",
                    opacity: isScrolling ? 1 : 0.5
                  }} />
                </div>
              )}

              {/* ✅ SCROLLABLE CODE */}
              <div
                ref={codeViewerRef}
                style={{
                  background: themeColors.bgInner,
                  borderRadius: "12px",
                  padding: "20px",
                  maxHeight: "400px",
                  overflowY: "auto"
                }}
              >
                <pre style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.5",
                  color: themeColors.textPrimary,
                }}>
                  {selectedCode.code}
                </pre>
              </div>

            </div>

            {/* Comments Section */}
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ margin: "0 0 15px 0", color: themeColors.textPrimary }}>Comments ({comments.length})</h4>
              <div style={{
                maxHeight: "200px",
                overflowY: "auto",
                marginBottom: "15px",
              }}>
                {comments.length === 0 ? (
                  <p style={{ color: themeColors.textSecondary, textAlign: "center" }}>No comments yet</p>
                ) : (
                  comments.map((comment, idx) => (
                    <div key={idx} style={{
                      background: themeColors.bgInner,
                      padding: "10px",
                      borderRadius: "8px",
                      marginBottom: "10px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <strong style={{ color: themeColors.accent }}>{comment.user_name || "Admin"}</strong>
                        <small style={{ color: themeColors.textSecondary }}>
                          {new Date(comment.created_at).toLocaleString()}
                        </small>
                      </div>
                      <p style={{ margin: 0, color: themeColors.textPrimary }}>{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: `1px solid ${themeColors.border}`,
                      background: themeColors.bgInner,
                      color: themeColors.textPrimary,
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={() => setShowEmoji(!showEmoji)}
                    style={{
                      ...buttonStyle.secondary,
                      fontSize: "20px",
                      padding: "0 15px",
                    }}
                  >
                    😊
                  </button>
                  <button onClick={addComment} style={buttonStyle.primary}>
                    Send
                  </button>
                </div>
                {showEmoji && (
                  <div style={{
                    position: "absolute",
                    bottom: "100%",
                    right: 0,
                    marginBottom: "10px",
                    zIndex: 1001,
                  }}>
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setSelectedCode(null)} style={buttonStyle.secondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
          @keyframes progressShimmer {
              0% { background-position: 0% 50%; }
              100% { background-position: 200% 50%; }
            }
      `}</style>
    </div>
  );
}

// StatCard Component
function StatCard({ icon, title, value, color, themeColors, theme }) {
  return (
    <div style={{
      background: themeColors.cardBg,
      padding: "25px",
      borderRadius: "16px",
      border: `1px solid ${themeColors.border}`,
      boxShadow: theme === "dark" ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.05)",
      transition: "all 0.3s ease",
      textAlign: "center"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = theme === "dark" ? "0 8px 20px rgba(0,0,0,0.15)" : "0 8px 20px rgba(0,0,0,0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = theme === "dark" ? "0 4px 12px rgba(0,0,0,0.1)" : "0 4px 12px rgba(0,0,0,0.05)";
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "10px" }}>{icon}</div>
      <h2 style={{ margin: "10px 0", color: color, fontSize: "2rem" }}>{value}</h2>
      <p style={{ color: themeColors.textSecondary, margin: 0 }}>{title}</p>
    </div>
  );
}

export default AdminDashboard;