import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import socket from "../../services/socket";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { themeColors } = useTheme();

  const [chatUnread, setChatUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  // 🔔 SOCKET REALTIME
  useEffect(() => {
    socket.on("newNotification", () => {
      API.get("/notifications/admin/unread")
        .then(res => setNotifUnread(res.data.unread));
    });

    socket.on("newMessage", () => {
      API.get("/chat/unread")
        .then(res => setChatUnread(res.data.unread));
    });

    return () => {
      socket.off("newNotification");
      socket.off("newMessage");
    };
  }, []);

  // 📡 INITIAL + INTERVAL FETCH
  useEffect(() => {
    const fetchData = async () => {
      try {
        const chatRes = await API.get("/chat/unread");
        setChatUnread(chatRes.data.unread);

        const notifRes = await API.get("/notifications/admin/unread");
        setNotifUnread(notifRes.data.unread);

      } catch (err) {
        console.error(err);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 15000); // ✅ same logic

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-layout">

      {/* ✅ HEADER */}
      <AdminHeader 
        navigate={navigate} 
        chatUnread={chatUnread} 
        notifUnread={notifUnread} 
      />

      {/* ✅ MAIN */}
      <main className="admin-main" style={{ 
        paddingTop: "80px", 
        minHeight: "80vh",
        backgroundColor: themeColors.background,
        color: themeColors.textPrimary
      }}>
        {children}
      </main>

      {/* ✅ FOOTER */}
      <AdminFooter />

    </div>
  );
}

export default AdminLayout;