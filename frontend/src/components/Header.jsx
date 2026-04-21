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
}) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <h1>AI Code Analyzer</h1>
        </div>

        <div className="header-right">
          <button
            className="nav-btn"
            onClick={() => navigate("/dashboard")}
          >
            Home
          </button>

          {/* "Analyze" dropdown */}
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
                  background: "#161b22",
                  border: "1px solid #30363d",
                  borderRadius: "10px",
                  padding: "10px",
                  minWidth: "200px",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              >
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/analyzer");
                  }}
                >
                  🔍 Code Analyzer
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/compare");
                  }}
                >
                  ⚖️ Compare Code
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/code-runner");
                  }}
                >
                  ▶️ Code Runner
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    setShowDropdown(false);
                    navigate("/explain");
                  }}
                >
                  📄 Explain Files
                </div>
              </div>
            )}
          </div>

          <button
            className="nav-btn"
            onClick={() => navigate("/history")}
          >
            History
          </button>

          <button
            className="nav-btn highlight"
            onClick={() => setShowProjectModal(true)}
          >
            Submit Project
          </button>

          {/* Notification Bell */}
          <div className="notification-container" style={{ position: "relative" }}>
            <button
              className="nav-btn notification-bell"
              onClick={() => setShowMessages(true)}
              style={{
                position: "relative",
                padding: "8px",
                background:
                  unreadCount > 0
                    ? "#f8514920"
                    : "transparent",
                border: "none",
                outline: "none",
              }}
            >
              <FaBell
                size={20}
                style={{
                  color: unreadCount > 0 ? "#f85149" : "#8b949e",
                }}
              />

              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#f85149",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(248,81,73,0.4)",
                    pointerEvents: "none",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile button */}
          <button
            className="nav-btn profile-btn"
            onClick={() => navigate("/profile")}
          >
            <FaUserCircle size={20} />
          </button>

          {/* Chat button / messages */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={() => navigate("/chat")}
              style={{
                padding: "8px",
                background: unread > 0 ? "#0ea5e920" : "transparent",
                border: "none",
                outline: "none",
              }}
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
                  padding: "3px 6px",
                  transform: "scale(0.9)",
                  fontWeight: "600",
                  pointerEvents: "none",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                {unread}
              </span>
            )}
          </div>

          {/* Logout */}
          <button
            className="nav-btn logout"
            onClick={logout}
          >
            <FaSignOutAlt size={20} />
          </button>
          <button className="nav-btn" onClick={toggleTheme}>
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;