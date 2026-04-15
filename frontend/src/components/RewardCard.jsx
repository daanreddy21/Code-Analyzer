import React from "react";

function RewardCard({ data, title = "🏆 Rewards Dashboard", theme = "dark" }) {
  if (!data) return null;

  const isDark = theme === "dark";

  // Dynamic Theme Palette
  const themeStyles = {
    cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#ffffff",
    cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
    textColor: isDark ? "#ffffff" : "#1e293b",
    secondaryText: isDark ? "#94a3b8" : "#64748b",
    statsBox: isDark ? "rgba(0, 0, 0, 0.2)" : "#f1f5f9",
    badgeBg: isDark ? "rgba(255, 255, 255, 0.1)" : "#e2e8f0",
    shadow: isDark 
      ? "0 8px 32px rgba(0,0,0,0.3)" 
      : "0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
  };

  return (
    <div style={{ ...cardStyle, background: themeStyles.cardBg, borderColor: themeStyles.cardBorder, color: themeStyles.textColor, boxShadow: themeStyles.shadow }}>
      
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={{ ...titleStyle, color: themeStyles.textColor }}>{title}</h3>
        {data.level && <span style={levelBadgeStyle}>{data.level}</span>}
      </div>

      {/* Points Summary */}
      <div style={{ ...statsBoxStyle, background: themeStyles.statsBox }}>
        <span style={{ ...labelStyle, color: themeStyles.secondaryText }}>Total Points</span>
        <div style={pointsValueStyle}>
          <span style={{ marginRight: "8px" }}>✨</span>
          {data.points}
        </div>
      </div>

      {/* Badges Section */}
      <div style={sectionSpacer}>
        <strong style={{ ...sectionLabelStyle, color: themeStyles.secondaryText }}>Badges</strong>
        <div style={badgeContainer}>
          {data.badges?.length > 0 ? (
            data.badges.map((b, i) => (
              <span key={i} style={{ ...chipStyle, background: themeStyles.badgeBg, color: themeStyles.textColor }}>
                {b}
              </span>
            ))
          ) : (
            <span style={{ color: themeStyles.secondaryText, fontSize: "0.8rem" }}>None</span>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={sectionSpacer}>
        <strong style={{ ...sectionLabelStyle, color: themeStyles.secondaryText }}>Recent Activity</strong>
        <div style={listStyle}>
          {data.rewards?.length > 0 ? (
            data.rewards.map((r, i) => (
              <div key={i} style={rowStyle}>
                <span style={{ color: "#6366f1" }}>•</span>
                <span style={{ flex: 1, color: themeStyles.textColor }}>{r.reason}</span>
                <span style={plusStyle}>+{r.points}</span>
              </div>
            ))
          ) : (
            <div style={{ color: themeStyles.secondaryText, fontSize: "0.8rem" }}>No activity</div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  borderRadius: "20px",
  padding: "20px",
  border: "1px solid",
  backdropFilter: "blur(10px)",
  transition: "all 0.3s ease",
  width: "100%",
  boxSizing: "border-box"
};

const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" };
const titleStyle = { margin: 0, fontSize: "1rem", fontWeight: "bold" };
const levelBadgeStyle = { background: "#8b5cf6", color: "white", padding: "4px 10px", borderRadius: "8px", fontSize: "0.65rem", fontWeight: "bold", textTransform: "uppercase" };
const statsBoxStyle = { padding: "12px 16px", borderRadius: "12px", marginBottom: "16px" };
const labelStyle = { fontSize: "0.65rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" };
const pointsValueStyle = { fontSize: "1.5rem", fontWeight: "800", marginTop: "4px" };
const sectionSpacer = { marginTop: "16px" };
const sectionLabelStyle = { fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "8px", display: "block" };
const badgeContainer = { display: "flex", flexWrap: "wrap", gap: "6px" };
const chipStyle = { padding: "4px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "500", border: "1px solid rgba(0,0,0,0.05)" };
const listStyle = { display: "flex", flexDirection: "column", gap: "8px" };
const rowStyle = { display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem" };
const plusStyle = { color: "#10b981", fontWeight: "bold" };

export default RewardCard;