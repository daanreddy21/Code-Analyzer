 // src/components/Header.jsx
import React, { useEffect } from "react";
import { FaUserCircle, FaSignOutAlt, FaBell, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext"; // ✅ NEW

function Header({
  navigate,
  unreadCount,
  unread,
  logout,
  showDropdown,
  setShowDropdown,
  setShowProjectModal,
  setShowMessages,
  toggleTheme,
  theme,
  showCustomInfo
}) {

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [setShowDropdown]);

  const { themeColors } = useTheme();

  const headerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: themeColors.headerBg,
    borderBottom: `1px solid ${themeColors.border}`,
    padding: "1rem 2rem",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease"
  };

  const dropdownStyle = {
    position: "absolute",
    top: "45px",
    left: 0,
    background: themeColors.cardBg,
    border: `1px solid ${themeColors.border}`,
    borderRadius: "12px",
    padding: "10px",
    minWidth: "220px",
    zIndex: 9999,
    boxShadow: theme === "dark" ? "0 10px 30px rgba(0,0,0,0.4)" : "0 10px 30px rgba(0,0,0,0.1)"
  };

  const dropdownItemStyle = {
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "0.2s",
    color: themeColors.textPrimary
  };

  return (
    <header style={headerStyle}>
      <div className="header-content" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* LEFT */}
        <div className="header-left">
          <h1 style={{ 
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "1.5rem",
            margin: 0
          }}>
            AI Code Analyzer
          </h1>
        </div>

        {/* RIGHT */}
        <div className="header-right" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button 
            className="nav-btn" 
            onClick={() => navigate("/dashboard")}
            style={buttonStyle(themeColors)}
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
              style={buttonStyle(themeColors)}
            >
              Analyze ▼
            </button>

            {showDropdown && (
              <div style={dropdownStyle}>
                {[
                  { label: "🔍 Code Analyzer", path: "/analyzer" },
                  { label: "⚖️ Compare Code", path: "/compare" },
                  { label: "▶️ Code Runner", path: "/code-runner" },
                  { label: "📄 Explain Files", path: "/explain" }
                ].map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setShowDropdown(false);
                      navigate(item.path);
                    }}
                    style={dropdownItemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hoverBg}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="nav-btn" onClick={() => navigate("/history")} style={buttonStyle(themeColors)}>
            History
          </button>

          <button className="nav-btn" onClick={() => setShowProjectModal(true)} style={buttonStyle(themeColors)}>
            Submit Project
          </button>

          {/* Notifications */}
          <div style={{ position: "relative" }}>
            <button
              className="nav-btn"
              onClick={() => setShowMessages(true)}
              style={{
                ...buttonStyle(themeColors),
                background: unreadCount > 0 ? `rgba(248,81,73,0.1)` : "transparent"
              }}
            >
              <FaBell size={18} />
            </button>
            {unreadCount > 0 && (
              <span style={badgeStyle(themeColors)}>{unreadCount}</span>
            )}
          </div>

          {/* Profile */}
          <button className="nav-btn" onClick={() => navigate("/profile")} style={buttonStyle(themeColors)}>
            <FaUserCircle size={20} />
          </button>

          {/* Chat */}
          <div style={{ position: "relative" }}>
            <button className="nav-btn" onClick={() => navigate("/chat")} style={buttonStyle(themeColors)}>
              💬
            </button>
            {unread > 0 && (
              <span style={{ ...badgeStyle(themeColors), background: "#ff0000" }}>{unread}</span>
            )}
          </div>

          {/* Theme Toggle */}
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

          {/* Logout */}
          <button className="nav-btn logout" onClick={logout} style={buttonStyle(themeColors)}>
            <FaSignOutAlt size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

const buttonStyle = (theme) => ({
  background: "transparent",
  border: "none",
  color: theme.textPrimary,
  cursor: "pointer",
  padding: "8px 12px",
  borderRadius: "8px",
  transition: "all 0.2s",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px"
});

const badgeStyle = (theme) => ({
  position: "absolute",
  top: "-5px",
  right: "-5px",
  background: theme.danger,
  color: "white",
  borderRadius: "50%",
  fontSize: "10px",
  padding: "3px 6px",
  fontWeight: "bold"
});

export default Header;