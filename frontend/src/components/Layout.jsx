// src/components/Layout.jsx
import React, { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Footer from "./Footer";
import MessagePopup from "./MessagePopup";
import API from "../services/api";
import socket from "../services/socket";
import ProjectSubmissionModal from "./ProjectSubmissionModal";
import { useTheme } from "../context/ThemeContext";
import { useLocation } from "react-router-dom";
import AdvancedInfoPopup from "./AdvancedInfoPopup";
import pageFullInfo from "../utils/pageFullInfo";
import useInactivityTracker from "../hooks/useInactivityTracker";
import InactivityPopup from "./InactivityPopup";

function Layout({ children, navigate }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  const isFetchingNotif = useRef(false);
  const isFetchingChat = useRef(false);

  const location = useLocation();

  const [showInfo, setShowInfo] = useState(false);
  const [customInfo, setCustomInfo] = useState(null);

  const { theme, toggleTheme, themeColors } = useTheme();


  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

    const { showPopup, countdown, resetTimer } = useInactivityTracker(handleLogout);



  const showCustomInfo = (info) => {
    setCustomInfo(info);
    setShowInfo(true);
  };


  const handleToggleTheme = () => {
    toggleTheme();
    setRenderKey(prev => prev + 1);
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // 🔔 FETCH NOTIFICATIONS
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
  const segments = location.pathname.split("/").filter(Boolean);
  const last = "/" + segments[segments.length - 1];

  const key = `visited_${last}`;
  const visited = localStorage.getItem(key);

  if (!visited && pageFullInfo[last]) {
    setShowInfo(true);
    localStorage.setItem(key, "true");
  }
}, [location.pathname]);

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
  const userId = localStorage.getItem("userId"); // or from auth

  if (userId) {
    socket.emit("join", userId);
  }


  socket.on("new_notification", (data) => {
    console.log("🔔 Live Notification:", data);

    fetchNotifications();


    alert(`${data.title}\n${data.message}`);
  });

  // 💬 CHAT (already working)
  socket.on("newMessage", fetchUnread);

  return () => {
    socket.off("new_notification");
    socket.off("newMessage");
  };
}, []);

  const layoutStyle = {
    minHeight: "100vh",
    background: themeColors.background,
    color: themeColors.textPrimary
  };

  const segments = location.pathname.split("/").filter(Boolean);
const last = "/" + segments[segments.length - 1];

const pageData = pageFullInfo[last];

  return (
    <div className="app-layout" style={layoutStyle}>
      
      {/* ✅ PASS showCustomInfo TO HEADER */}
      <Header
        navigate={navigate}
        unreadCount={unreadCount}
        unread={unread}
        logout={logout}
        showDropdown={showDropdown}
        setShowDropdown={setShowDropdown}
        setShowProjectModal={setShowProjectModal}
        setShowMessages={setShowMessages}
        toggleTheme={handleToggleTheme}
        theme={theme}
        showCustomInfo={showCustomInfo}   // ✅ IMPORTANT FIX
      />
      

      {/* ✅ PASS showCustomInfo TO ALL PAGES */}
      <main
        key={renderKey}
        className="app-main"
        style={{ paddingTop: "80px", minHeight: "calc(100vh - 80px)" }}
      >
        {React.cloneElement(children, { showCustomInfo })}
      </main>

      <Footer />

      {/* 🔔 NOTIFICATIONS POPUP */}
        <MessagePopup
          isOpen={showMessages}
          onClose={() => setShowMessages(false)}
          onMarkRead={fetchNotifications}
          showCustomInfo={showCustomInfo}   // ✅ ADD THIS
        />

      {/* 📤 PROJECT SUBMISSION */}
        <ProjectSubmissionModal
          isOpen={showProjectModal}
          onClose={() => setShowProjectModal(false)}
          showCustomInfo={showCustomInfo}   // ✅ ADD THIS
        />

      {/* 🔥 GLOBAL INFO POPUP */}
      {(showInfo || customInfo) && (
        <AdvancedInfoPopup
  data={customInfo || pageData}
  onClose={() => {
    setShowInfo(false);
    setCustomInfo(null);
  }}
/>
      )}

      
      {/* <div
        onClick={() => setShowInfo(true)}
        onMouseEnter={() => setShowInfo(true)}
        style={{
          position: "fixed",
          bottom: "90px",
          right: "30px",
          background: "#4c51bf",
          color: "#fff",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          fontSize: "22px"
        }}
      >
        ℹ️
      </div> */}
      {showPopup && (
        <InactivityPopup 
          countdown={countdown} 
          onStay={resetTimer}
        />
      )}
    </div>
  );
}

export default Layout;