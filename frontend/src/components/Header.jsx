// src/components/Header.jsx
import React from "react";
import { FaUserCircle, FaSignOutAlt, FaBell } from "react-icons/fa";

function Header({
  navigate,
  unreadCount,
  unread,
  logout,
  showDropdown,
  setShowDropdown,
  setShowProjectModal,
  setShowMessages,
  toggleTheme,   // ✅ FIXED (added)
  theme          // ✅ FIXED (added)
}) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        
        {/* LEFT */}
        <div className="header-left">
          <h1>AI Code Analyzer</h1>
        </div>

        {/* RIGHT */}
        <div className="header-right">
          
          {/* Home */}
          <button
            className="nav-btn"
            onClick={() => navigate("/dashboard")}
          >
            Home
          </button>

          {/* Analyze Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              Analyze ▼
            </button>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  left: 0,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "10px",
                  minWidth: "200px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <div onClick={() => { setShowDropdown(false); navigate("/analyzer"); }}>
                  🔍 Code Analyzer
                </div>
                <div onClick={() => { setShowDropdown(false); navigate("/compare"); }}>
                  ⚖️ Compare Code
                </div>
                <div onClick={() => { setShowDropdown(false); navigate("/code-runner"); }}>
                  ▶️ Code Runner
                </div>
                <div onClick={() => { setShowDropdown(false); navigate("/explain"); }}>
                  📄 Explain Files
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <button
            className="nav-btn"
            onClick={() => navigate("/history")}
          >
            History
          </button>

          {/* Submit */}
          <button
            className="nav-btn highlight"
            onClick={() => setShowProjectModal(true)}
          >
            Submit Project
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={() => setShowMessages(true)}
              style={{
                background: unreadCount > 0 ? "rgba(248,81,73,0.1)" : "transparent"
              }}
            >
              <FaBell size={18} />
            </button>

            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "10px",
                  padding: "3px 6px"
                }}
              >
                {unreadCount}
              </span>
            )}
          </div>

          {/* Profile */}
          <button
            className="nav-btn"
            onClick={() => navigate("/profile")}
          >
            <FaUserCircle size={20} />
          </button>

          {/* Chat */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={() => navigate("/chat")}
            >
              💬
            </button>

            {unread > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  fontSize: "10px",
                  padding: "3px 6px"
                }}
              >
                {unread}
              </span>
            )}
          </div>

          {/* 🌙 THEME TOGGLE (FIXED) */}
          <button className="nav-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          {/* Logout */}
          <button
            className="nav-btn logout"
            onClick={logout}
          >
            <FaSignOutAlt size={20} />
          </button>

        </div>
      </div>
    </header>
  );
}

export default Header;