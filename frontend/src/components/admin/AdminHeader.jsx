import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

function AdminHeader({ navigate, unread }) {

  // ✅ USE THEME FROM CONTEXT
  const { theme, toggleTheme, themeColors } = useTheme();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="dashboard-header" style={{
      background: themeColors.cardBg,
      borderBottom: `1px solid ${themeColors.border}`,
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backdropFilter: "blur(10px)",
    }}>
      <div className="header-content" style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        height: "70px",
      }}>

        <div className="header-left">
          <h1 style={{ 
            fontSize: "1.5rem",
            margin: 0,
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            cursor: "pointer",
          }}
          onClick={() => navigate("/admin/dashboard")}>
            🛠 Admin Control
          </h1>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>

          {/* 🏠 ADMIN DASHBOARD HOME BUTTON */}
          <button 
            className="nav-btn" 
            onClick={() => navigate("/admin")} 
            style={buttonStyle(themeColors)}
          >
            🏠 Dashboard
          </button>

          {/* 💬 CHAT */}
          <div style={{ position: "relative" }}>
            <button className="nav-btn" onClick={() => navigate("/chat")} style={buttonStyle(themeColors)}>
              💬 Chat-M
            </button>
            {unread > 0 && (
              <span style={badgeStyle(themeColors)}>
                {unread}
              </span>
            )}
          </div>

          {/* 👨‍🎓 STUDENTS BUTTON */}
          <button className="nav-btn" onClick={() => navigate("/admin/students")} style={buttonStyle(themeColors)}>
            👨‍🎓 Students
          </button>

          {/* 👤 PROFILE BUTTON */}
          <button className="nav-btn" onClick={() => navigate("/admin/profile")} style={buttonStyle(themeColors)}>
            👤 Profile
          </button>

          {/* 🌙 THEME BUTTON */}
          <button
            className="nav-btn"
            onClick={toggleTheme}
            style={{
              ...buttonStyle(themeColors),
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>

          {/* 🚪 LOGOUT BUTTON */}
          <button
            className="nav-btn"
            onClick={logout}
            style={{
              ...buttonStyle(themeColors),
              border: `1px solid ${themeColors.danger}`,
              background: "transparent",
              color: themeColors.danger,
            }}
          >
            🚪 Logout
          </button>

        </div>
      </div>
    </header>
  );
}

const buttonStyle = (themeColors) => ({
  padding: "8px 16px",
  borderRadius: "8px",
  border: "none",
  background: themeColors.bgInner,
  color: themeColors.textPrimary,
  cursor: "pointer",
  transition: "all 0.2s ease",
  fontSize: "14px",
  fontWeight: "500",
});

const badgeStyle = (themeColors) => ({
  position: "absolute",
  top: "-5px",
  right: "-5px",
  background: themeColors.danger,
  color: "#fff",
  borderRadius: "50%",
  fontSize: "10px",
  padding: "3px 6px",
  fontWeight: "bold",
});

export default AdminHeader;