// src/components/Layout.jsx
import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MessagePopup from "./MessagePopup";
import API from "../services/api";
import socket from "../services/socket";
import ProjectSubmissionModal from "./ProjectSubmissionModal";
import { useTheme } from "../context/ThemeContext";

function Layout({ children, navigate }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [renderKey, setRenderKey] = useState(0); // ✅ ADDED: Force re-render key

  const isFetchingNotif = useRef(false);
  const isFetchingChat = useRef(false);

  const { theme, toggleTheme, themeColors } = useTheme();

  // ✅ ADDED: Custom toggle function that forces re-render
  const handleToggleTheme = () => {
    toggleTheme();
    setRenderKey(prev => prev + 1); // Forces re-render of components using this key
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Notification fetch
  const fetchNotifications = async () => {
    if (isFetchingNotif.current) return;
    if (document.visibilityState !== "visible") return;

    isFetchingNotif.current = true;

    try {
      const res = await API.get("/notifications");
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error("Notification fetch error", err);
      }
    } finally {
      isFetchingNotif.current = false;
    }
  };

  // Chat fetch
  const fetchUnread = async () => {
    if (isFetchingChat.current) return;
    if (document.visibilityState !== "visible") return;

    isFetchingChat.current = true;

    try {
      const res = await API.get("/chat/unread");
      setUnread(res.data.unread);
    } catch (err) {
      if (err.response?.status !== 429) {
        console.error("Chat fetch error", err);
      }
    } finally {
      isFetchingChat.current = false;
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    socket.on("newNotification", fetchNotifications);
    socket.on("newMessage", fetchUnread);

    return () => {
      socket.off("newNotification");
      socket.off("newMessage");
    };
  }, []);

  const layoutStyle = {
    minHeight: "100vh",
    background: themeColors.background,
    color: themeColors.textPrimary,
    transition: "all 0.3s ease"
  };

  return (
    <div className="app-layout" style={layoutStyle}>
      <Header
        navigate={navigate}
        unreadCount={unreadCount}
        unread={unread}
        logout={logout}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        setShowProjectModal={setShowProjectModal}
        setShowMessages={setShowMessages}
        toggleTheme={handleToggleTheme}  // ✅ CHANGED: Use custom handler
        theme={theme}
      />

      {/* ✅ ADDED: key prop to force re-render of children when theme changes */}
      <main key={renderKey} className="app-main" style={{ paddingTop: "80px", minHeight: "calc(100vh - 80px)" }}>
        {children}
      </main>

      <Footer />

      <MessagePopup
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        onMarkRead={fetchNotifications}
      />

      <ProjectSubmissionModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
      />
    </div>
  );
}

export default Layout;