import React from "react";
import { useTheme } from "../context/ThemeContext";

function RewardCard({ data, title = "🏆 Rewards Dashboard" }) {
  if (!data) return null;

  // ✅ USE THEME FROM CONTEXT
  const { themeColors } = useTheme();

  return (
    <div style={{ 
      ...cardStyle, 
      background: themeColors.cardBg, 
      borderColor: themeColors.border, 
      color: themeColors.textPrimary,
      backdropFilter: 'blur(10px)'
    }}>
      
      {/* Header */}
      <div style={headerStyle}>
        <h3 style={{ ...titleStyle, color: themeColors.textPrimary }}>{title}</h3>
        {data.level && (
          <span style={{ 
            ...levelBadgeStyle, 
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            boxShadow: `0 2px 8px ${themeColors.accentGlow}`
          }}>
            {data.level}
          </span>
        )}
      </div>

      {/* Points Summary */}
      <div style={{ 
        ...statsBoxStyle, 
        background: themeColors.accentGlow,
        border: `1px solid ${themeColors.border}`
      }}>
        <span style={{ ...labelStyle, color: themeColors.textSecondary }}>Total Points</span>
        <div style={pointsValueStyle}>
          <span style={{ marginRight: "8px" }}>✨</span>
          <span style={{ color: themeColors.accent, fontSize: "2rem", fontWeight: "bold" }}>{data.points}</span>
        </div>
      </div>

      {/* Badges Section */}
      <div style={sectionSpacer}>
        <strong style={{ ...sectionLabelStyle, color: themeColors.textSecondary }}>🎖️ Badges Earned</strong>
        <div style={badgeContainer}>
          {data.badges?.length > 0 ? (
            data.badges.map((b, i) => (
              <span key={i} style={{ 
                ...chipStyle, 
                background: themeColors.accentGlow,
                border: `1px solid ${themeColors.accent}`,
                color: themeColors.accent
              }}>
                {b}
              </span>
            ))
          ) : (
            <span style={{ color: themeColors.textSecondary, fontSize: "0.8rem" }}>No badges yet</span>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={sectionSpacer}>
        <strong style={{ ...sectionLabelStyle, color: themeColors.textSecondary }}>📋 Recent Activity</strong>
        <div style={listStyle}>
          {data.rewards?.length > 0 ? (
            data.rewards.map((r, i) => (
              <div key={i} style={{ 
                ...rowStyle, 
                borderBottom: i !== data.rewards.length - 1 ? `1px solid ${themeColors.border}` : 'none',
                paddingBottom: i !== data.rewards.length - 1 ? '8px' : 0
              }}>
                <span style={{ color: themeColors.accent }}>•</span>
                <span style={{ flex: 1, color: themeColors.textPrimary, fontSize: "0.85rem" }}>{r.reason}</span>
                <span style={{ ...plusStyle, color: themeColors.success }}>+{r.points}</span>
              </div>
            ))
          ) : (
            <div style={{ color: themeColors.textSecondary, fontSize: "0.8rem", textAlign: "center", padding: "20px" }}>
              No activity yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle = {
  borderRadius: "20px",
  padding: "24px",
  border: "1px solid",
  transition: "all 0.3s ease",
  width: "100%",
  boxSizing: "border-box",
  cursor: "pointer"
};

const headerStyle = { 
  display: "flex", 
  justifyContent: "space-between", 
  alignItems: "center", 
  marginBottom: "20px" 
};

const titleStyle = { 
  margin: 0, 
  fontSize: "1.1rem", 
  fontWeight: "600",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const levelBadgeStyle = { 
  color: "white", 
  padding: "4px 12px", 
  borderRadius: "20px", 
  fontSize: "0.7rem", 
  fontWeight: "bold", 
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const statsBoxStyle = { 
  padding: "16px", 
  borderRadius: "12px", 
  marginBottom: "20px",
  transition: "all 0.2s"
};

const labelStyle = { 
  fontSize: "0.7rem", 
  fontWeight: "600", 
  textTransform: "uppercase", 
  letterSpacing: "0.05em" 
};

const pointsValueStyle = { 
  fontSize: "1.5rem", 
  fontWeight: "800", 
  marginTop: "8px",
  display: "flex",
  alignItems: "center"
};

const sectionSpacer = { 
  marginTop: "20px" 
};

const sectionLabelStyle = { 
  fontSize: "0.75rem", 
  textTransform: "uppercase", 
  marginBottom: "12px", 
  display: "block",
  fontWeight: "600",
  letterSpacing: "0.5px"
};

const badgeContainer = { 
  display: "flex", 
  flexWrap: "wrap", 
  gap: "8px" 
};

const chipStyle = { 
  padding: "6px 12px", 
  borderRadius: "20px", 
  fontSize: "0.75rem", 
  fontWeight: "500",
  transition: "all 0.2s"
};

const listStyle = { 
  display: "flex", 
  flexDirection: "column", 
  gap: "8px",
  maxHeight: "200px",
  overflowY: "auto"
};

const rowStyle = { 
  display: "flex", 
  alignItems: "center", 
  gap: "12px", 
  fontSize: "0.85rem" 
};

const plusStyle = { 
  fontWeight: "bold",
  fontSize: "0.85rem"
};

export default RewardCard;