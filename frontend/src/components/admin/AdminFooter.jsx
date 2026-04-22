import React from "react";
import { useTheme } from "../../context/ThemeContext";

function AdminFooter() {
  const { themeColors } = useTheme();

  return (
    <footer className="dashboard-footer" style={{
      background: themeColors.cardBg,
      borderTop: `1px solid ${themeColors.border}`,
      padding: "20px",
      marginTop: "auto",
    }}>
      <div className="footer-content">
        <div style={{
          textAlign: "center",
          color: themeColors.textSecondary,
          fontSize: "14px"
        }}>
          <p>© 2026 AI Code Analyzer • Admin Portal • Internal Use Only</p>
        </div>
      </div>
    </footer>
  );
}

export default AdminFooter;