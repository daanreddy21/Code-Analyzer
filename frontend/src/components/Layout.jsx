// src/components/Layout.jsx
import React from "react";
import Header from "./Header";
import Footer from "./Footer";

// ✅ Layout that works only around /dashboard (header + footer fixed)
function Layout({ children, navigate }) {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [unread, setUnread] = React.useState(0);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showProjectModal, setShowProjectModal] = React.useState(false);
  const [showMessages, setShowMessages] = React.useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Fixed Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#101f4c",
          borderBottom: "1px solid #30363d"
        }}
      >
        <Header
          navigate={navigate}
          unreadCount={unreadCount}
          unread={unread}
          logout={logout}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          showProjectModal={showProjectModal}
          setShowProjectModal={setShowProjectModal}
          showMessages={showMessages}
          setShowMessages={setShowMessages}
        />
      </header>

      {/* Scrollable middle content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "0 20px" }}>
        {children}
      </main>

      {/* Fixed Footer */}
      <Footer />
    </div>
  );
}

export default Layout;