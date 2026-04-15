// src/components/DashboardFooter.jsx
import React from "react";

function Footer() {
  return (
    <footer className="dashboard-footer">
      <div className="footer-content">
        {/* Brand */}
        <div className="footer-brand">
          <h3>🚀 AI Code Analyzer</h3>
          <p>Analyze, optimize & improve your code using AI</p>
        </div>

        {/* Links */}
        <div className="footer-links">
          <div>
            <h4>Quick Links</h4>
            <a href="/analyzer">Analyze Code</a>
            <a href="/history">History</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/">Home</a>
          </div>

          <div>
            <h4>Resources</h4>
            <a href="#">Docs</a>
            <a href="#">API</a>
            <a href="#">Support</a>
            <a href="#">Privacy</a>
          </div>

          <div>
            <h4>Connect</h4>
            <a href="#">GitHub</a>
            <a href="#">LinkedIn</a>
            <a href="#">Twitter</a>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-bottom">
          <p>© 2026 AI Code Analyzer • Built with ❤️ for developers</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;