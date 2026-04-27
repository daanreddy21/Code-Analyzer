import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import MessagePopup from "../MessagePopup"; // ✅ USE SAME USER POPUP

function AdminHeader({ navigate, chatUnread, notifUnread }) {

  const { theme, toggleTheme, themeColors } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <>
      <header
        className="dashboard-header"
        style={{
          background: themeColors.cardBg,
          borderBottom: `1px solid ${themeColors.border}`,
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backdropFilter: "blur(10px)",
          padding: "",
        }}
      >
        <div
          className="header-content"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            height: "55px",
          }}
        >
          {/* LEFT */}
          <div className="header-left">
            <h1
              style={{
                fontSize: "1.5rem",
                margin: 0,
                background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                cursor: "pointer",
              }}
              onClick={() => navigate("/admin")}
            >
              🛠 Admin Control
            </h1>
          </div>

          {/* RIGHT */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {/* 🏠 DASHBOARD */}
            <button
              onClick={() => navigate("/admin")}
              style={buttonStyle(themeColors)}
            >
              🏠 Dashboard
            </button>

            {/* 💬 CHAT */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => navigate("/chat")}
                style={buttonStyle(themeColors)}
              >
                💬 Chat-M
              </button>

              {chatUnread > 0 && (
                <span style={badgeStyle(themeColors)}>
                  {chatUnread}
                </span>
              )}
            </div>

            {/* 🔔 NOTIFICATIONS */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(true)}
                style={buttonStyle(themeColors)}
              >
                🔔 Notifications
              </button>

              {notifUnread > 0 && (
                <span style={badgeStyle(themeColors)}>
                  {notifUnread}
                </span>
              )}
            </div>

            {/* 👨‍🎓 STUDENTS */}
            <button
              onClick={() => navigate("/admin/students")}
              style={buttonStyle(themeColors)}
            >
              👨‍🎓 Students
            </button>

            {/* 👤 PROFILE */}
            <button
              onClick={() => navigate("/admin/profile")}
              style={buttonStyle(themeColors)}
            >
              👤 Profile
            </button>

            {/* 🌙 THEME */}
            <button
              onClick={toggleTheme}
              style={{
                ...buttonStyle(themeColors),
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* 🚪 LOGOUT */}
            <button
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

      {/* 🔔 SAME USER POPUP (IMPORTANT FIX) */}
      <MessagePopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onMarkRead={() => {}}
      />
    </>
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