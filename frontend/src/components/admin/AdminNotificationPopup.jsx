import React, { useEffect, useState } from "react";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

function AdminNotificationPopup({ isOpen, onClose, onMarkRead }) {
  const [notifications, setNotifications] = useState([]);
  const { themeColors } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (n) => {
    try {
      await API.put(`/notifications/${n.id}/read`);
      onMarkRead();

      // 🔥 NAVIGATION LOGIC
      if (n.type === "comment" || n.type === "submission") {
        navigate("/admin/students");
      }

      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={{ ...popupStyle, background: themeColors.cardBg }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ color: themeColors.textPrimary }}>🔔 Notifications</h3>
          <button onClick={onClose}>✖</button>
        </div>

        {notifications.length === 0 ? (
          <p style={{ color: themeColors.textSecondary }}>No notifications</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                padding: "10px",
                marginTop: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                background: n.is_read ? "transparent" : themeColors.bgInner,
                border: `1px solid ${themeColors.border}`
              }}
            >
              <strong>{getIcon(n.type)} {n.title}</strong>
              <p style={{ fontSize: "13px" }}>{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const getIcon = (type) => {
  if (type === "comment") return "💬";
  if (type === "submission") return "📂";
  if (type === "approval") return "✅";
  return "🔔";
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999
};

const popupStyle = {
  width: "400px",
  maxHeight: "500px",
  overflowY: "auto",
  padding: "16px",
  borderRadius: "12px"
};

export default AdminNotificationPopup;