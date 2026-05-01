import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { 
  FaExclamationTriangle, 
  FaClock, 
  FaUserClock, 
  FaSignOutAlt,
  FaHourglassHalf,
  FaSpinner
} from "react-icons/fa";

function InactivityPopup({ countdown, onStay }) {
  const { themeColors, theme } = useTheme();
  const [progress, setProgress] = useState(100);
  const totalTime = 60; // 60 seconds total timeout

  useEffect(() => {
    // Calculate progress percentage (countdown from 60 to 0)
    const progressPercent = (countdown / totalTime) * 100;
    setProgress(progressPercent);
  }, [countdown]);

  // Determine color based on remaining time
  const getCountdownColor = () => {
    if (countdown <= 10) return themeColors.danger;
    if (countdown <= 20) return themeColors.warning;
    return themeColors.accent;
  };

  // Get status message based on time
  const getStatusMessage = () => {
    if (countdown <= 5) return "⚠️ Critical - Action Required!";
    if (countdown <= 15) return "🔴 Session ending very soon";
    if (countdown <= 30) return "🟡 Session expiring soon";
    return "🟢 Your session is about to expire";
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: theme === 'dark' ? 'rgba(10, 10, 26, 0.95)' : 'rgba(0, 0, 0, 0.7)',
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      backdropFilter: "blur(8px)",
      animation: "fadeIn 0.3s ease"
    }}>
      <div style={{
        background: themeColors.cardBg,
        padding: "40px",
        borderRadius: "24px",
        textAlign: "center",
        color: themeColors.textPrimary,
        width: "400px",
        maxWidth: "90%",
        border: `1px solid ${themeColors.border}`,
        boxShadow: theme === 'dark' ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.15)",
        animation: "slideUp 0.4s ease",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Animated background gradient */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${themeColors.accent}, ${getCountdownColor()})`,
          width: `${progress}%`,
          transition: "width 1s linear"
        }} />

        {/* Icon Section */}
        <div style={{
          width: "80px",
          height: "80px",
          margin: "0 auto 20px",
          background: `${getCountdownColor()}20`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          animation: "pulse 2s infinite"
        }}>
          {countdown <= 10 ? (
            <FaExclamationTriangle size={40} color={getCountdownColor()} />
          ) : countdown <= 30 ? (
            <FaHourglassHalf size={40} color={getCountdownColor()} />
          ) : (
            <FaUserClock size={40} color={getCountdownColor()} />
          )}
        </div>

        {/* Title */}
        <h3 style={{
          color: getCountdownColor(),
          marginBottom: "12px",
          fontSize: "22px",
          fontWeight: "700"
        }}>
          ⚠️ Session Expiring
        </h3>

        {/* Message */}
        <p style={{
          color: themeColors.textSecondary,
          marginBottom: "8px",
          fontSize: "14px"
        }}>
          {getStatusMessage()}
        </p>

        <p style={{
          color: themeColors.textSecondary,
          marginBottom: "16px",
          fontSize: "13px"
        }}>
          You will be logged out in
        </p>

        {/* Countdown Timer */}
        <div style={{
          position: "relative",
          display: "inline-block",
          marginBottom: "24px"
        }}>
          {/* Circular progress background */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={themeColors.border}
              strokeWidth="6"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={getCountdownColor()}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          
          {/* Countdown Number */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "36px",
              fontWeight: "800",
              color: getCountdownColor(),
              lineHeight: "1"
            }}>
              {countdown}
            </div>
            <div style={{
              fontSize: "11px",
              color: themeColors.textSecondary,
              marginTop: "4px"
            }}>
              seconds
            </div>
          </div>
        </div>

        {/* Progress Bar Text */}
        <div style={{
          marginBottom: "24px",
          padding: "8px 12px",
          background: `${getCountdownColor()}10`,
          borderRadius: "8px",
          display: "inline-block"
        }}>
          <span style={{
            fontSize: "12px",
            color: getCountdownColor(),
            fontWeight: "600"
          }}>
            {Math.floor(progress)}% of session remaining
          </span>
        </div>

        {/* Warning for critical time */}
        {countdown <= 10 && (
          <div style={{
            marginBottom: "20px",
            padding: "10px",
            background: `${themeColors.danger}20`,
            borderRadius: "10px",
            borderLeft: `3px solid ${themeColors.danger}`,
            textAlign: "left"
          }}>
            <p style={{
              fontSize: "12px",
              color: themeColors.danger,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <FaExclamationTriangle size={12} />
              <strong>Critical:</strong> Session will expire immediately after timer reaches 0
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "center"
        }}>
          <button
            onClick={onStay}
            style={{
              flex: 1,
              padding: "12px 24px",
              border: "none",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
              color: "#fff",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.accentGlow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <FaClock size={14} />
            Stay Logged In
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            style={{
              flex: 1,
              padding: "12px 24px",
              border: `1px solid ${themeColors.border}`,
              borderRadius: "12px",
              background: "transparent",
              color: themeColors.textSecondary,
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${themeColors.danger}20`;
              e.currentTarget.style.borderColor = themeColors.danger;
              e.currentTarget.style.color = themeColors.danger;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = themeColors.border;
              e.currentTarget.style.color = themeColors.textSecondary;
            }}
          >
            <FaSignOutAlt size={14} />
            Logout Now
          </button>
        </div>

        {/* Session Info */}
        <div style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: `1px solid ${themeColors.border}`,
          display: "flex",
          justifyContent: "center",
          gap: "16px"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: themeColors.textSecondary
          }}>
            <FaClock size={10} />
            <span>Auto-logout: 60s</span>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: themeColors.textSecondary
          }}>
            <FaSpinner size={10} />
            <span>Inactivity detected</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
}

export default InactivityPopup;