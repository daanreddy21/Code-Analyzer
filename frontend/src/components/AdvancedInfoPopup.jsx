import React, { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { 
  FaTimes, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaLightbulb,
  FaWindowMaximize,
  FaArrowRight
} from "react-icons/fa";

function AdvancedInfoPopup({ data, onClose }) {

  // ✅ ESC KEY CLOSE
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  if (!data || !data.title) return null;

  // Dynamic styles using themeColors
  const overlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: theme === 'dark' ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000000,
    backdropFilter: "blur(4px)",
    animation: "fadeIn 0.2s ease"
  };

  const popup = {
    background: themeColors.cardBg,
    padding: "32px",
    borderRadius: "24px",
    width: "550px",
    maxWidth: "90vw",
    maxHeight: "85vh",
    overflowY: "auto",
    color: themeColors.textPrimary,
    position: "relative",
    border: `1px solid ${themeColors.border}`,
    boxShadow: theme === 'dark' ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.15)",
    animation: "modalSlideIn 0.3s ease"
  };

  const closeButton = {
    position: "absolute",
    top: "20px",
    right: "20px",
    background: themeColors.accentGlow,
    border: "none",
    color: themeColors.textSecondary,
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s ease"
  };

  const titleStyle = {
    fontSize: "1.75rem",
    fontWeight: "700",
    marginBottom: "16px",
    background: `linear-gradient(135deg, ${themeColors.textPrimary}, ${themeColors.accent})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    paddingRight: "40px"
  };

  const descriptionStyle = {
    color: themeColors.textSecondary,
    fontSize: "14px",
    lineHeight: "1.6",
    marginBottom: "24px",
    paddingBottom: "20px",
    borderBottom: `1px solid ${themeColors.border}`
  };

  const sectionHeaderStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: "24px 0 16px 0",
    fontSize: "1.1rem",
    fontWeight: "600",
    color: themeColors.accent
  };

  const card = {
    marginBottom: "12px",
    padding: "16px",
    background: themeColors.bgInner,
    borderRadius: "12px",
    border: `1px solid ${themeColors.border}`,
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer"
  };

  const cardTitle = {
    fontWeight: "600",
    color: themeColors.textPrimary,
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  };

  const cardDescription = {
    color: themeColors.textSecondary,
    fontSize: "13px",
    lineHeight: "1.5",
    margin: 0
  };

  const button = {
    marginTop: "24px",
    padding: "12px 24px",
    background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
    border: "none",
    color: "#fff",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    width: "100%",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  };

  return (
    <div style={overlay} onClick={onClose}>
      {/* 🔥 POPUP CONTENT */}
      <div
        style={popup}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={closeButton}
          onClick={onClose}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeColors.danger;
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = themeColors.accentGlow;
            e.currentTarget.style.color = themeColors.textSecondary;
          }}
        >
          <FaTimes size={16} />
        </button>

        {/* Title */}
        <h2 style={titleStyle}>{data.title}</h2>

        {/* Description */}
        {data.description && (
          <p style={descriptionStyle}>{data.description}</p>
        )}

        {/* ✅ SECTIONS */}
        {data.sections && data.sections.length > 0 && (
          <>
            <div style={sectionHeaderStyle}>
              <FaLightbulb size={16} />
              <span>Key Sections</span>
            </div>
            {data.sections.map((sec, i) => (
              <div 
                key={i} 
                style={card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={cardTitle}>
                  <FaInfoCircle size={12} color={themeColors.accent} />
                  <span>{sec.name}</span>
                </div>
                <p style={cardDescription}>{sec.details}</p>
              </div>
            ))}
          </>
        )}

        {/* 🪟 INTERNAL POPUPS */}
        {data.popups && data.popups.length > 0 && (
          <>
            <div style={sectionHeaderStyle}>
              <FaWindowMaximize size={16} />
              <span>Internal Popups</span>
            </div>
            {data.popups.map((p, i) => (
              <div 
                key={i} 
                style={card}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.accentGlow}`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={cardTitle}>
                  <FaWindowMaximize size={12} color={themeColors.success} />
                  <span>{p.name}</span>
                </div>
                <p style={cardDescription}>{p.details}</p>
              </div>
            ))}
          </>
        )}

        {/* Action Button */}
        <button
          onClick={onClose}
          style={button}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.accentGlow}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Got it <FaArrowRight size={12} />
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default AdvancedInfoPopup;