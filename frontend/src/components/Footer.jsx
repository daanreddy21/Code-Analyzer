// src/components/Footer.jsx
import React from "react";
import { useTheme } from "../context/ThemeContext";

function Footer() {
  const { themeColors, theme } = useTheme();

  const footerStyle = {
    background: themeColors.footerBg,
    borderTop: `1px solid ${themeColors.border}`,
    padding: "2rem",
    marginTop: "auto",
    transition: "all 0.3s ease"
  };

  const linkStyle = {
    color: themeColors.textSecondary,
    textDecoration: "none",
    transition: "color 0.2s",
    fontSize: "14px"
  };

  return (
    <footer style={footerStyle}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h3 style={{ 
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px"
          }}>
            🚀 AI Code Analyzer
          </h3>
          <p style={{ color: themeColors.textSecondary, fontSize: "14px" }}>
            Analyze, optimize & improve your code using AI
          </p>
        </div>

        {/* Links */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "2rem",
          marginBottom: "2rem",
          textAlign: "center"
        }}>
          <div>
            <h4 style={{ color: themeColors.textPrimary, marginBottom: "12px" }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href="/analyzer" style={linkStyle}>Analyze Code</a>
              <a href="/history" style={linkStyle}>History</a>
              <a href="/dashboard" style={linkStyle}>Dashboard</a>
              <a href="/" style={linkStyle}>Home</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: themeColors.textPrimary, marginBottom: "12px" }}>Resources</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href="#" style={linkStyle}>Docs</a>
              <a href="#" style={linkStyle}>API</a>
              <a href="#" style={linkStyle}>Support</a>
              <a href="#" style={linkStyle}>Privacy</a>
            </div>
          </div>

          <div>
            <h4 style={{ color: themeColors.textPrimary, marginBottom: "12px" }}>Connect</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <a href="#" style={linkStyle}>GitHub</a>
              <a href="#" style={linkStyle}>LinkedIn</a>
              <a href="#" style={linkStyle}>Twitter</a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ 
          textAlign: "center", 
          paddingTop: "1.5rem", 
          borderTop: `1px solid ${themeColors.border}`,
          color: themeColors.textSecondary,
          fontSize: "12px"
        }}>
          <p>© 2026 AI Code Analyzer • Built with ❤️ for developers</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;