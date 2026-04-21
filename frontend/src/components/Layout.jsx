import React, { useState, useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";

function Layout({ children, navigate }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // 🌙 THEME STATE
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "dark"
  );

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="app-layout">
      
      {/* ✅ GLOBAL HEADER */}
      <Header
        navigate={navigate}
        unreadCount={unreadCount}
        unread={unread}
        logout={logout}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        setShowProjectModal={setShowProjectModal}
        setShowMessages={setShowMessages}
        toggleTheme={toggleTheme}   // 🔥 NEW
        theme={theme}               // 🔥 NEW
      />

      {/* ✅ MAIN CONTENT */}
      <main className="app-main">
        {children}
      </main>

      {/* ✅ GLOBAL FOOTER */}
      <Footer />
    </div>
  );
}

export default Layout;