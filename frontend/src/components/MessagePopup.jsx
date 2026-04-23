import { useState, useEffect } from "react";
import { 
  FaBell, 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle,
  FaExclamationTriangle
} from "react-icons/fa";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

function MessagePopup({ isOpen, onClose, onMarkRead, showCustomInfo }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupedMessages, setGroupedMessages] = useState({});
  
  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);
   
useEffect(() => {
  if (isOpen && showCustomInfo) {
    const key = "visited_notifications";
    const visited = localStorage.getItem(key);

    if (!visited) {
      const timer = setTimeout(() => {
        showCustomInfo({
          title: "Notifications Panel",
          description:
            "This panel shows all your notifications and system updates in real-time.",
          sections: [
            {
              name: "Real-time Updates",
              details:
                "Notifications are received instantly using socket connection."
            },
            {
              name: "Unread Messages",
              details:
                "Displays notifications you haven’t seen yet."
            },
            {
              name: "Mark as Read",
              details:
                "Allows you to clear notifications after viewing."
            }
          ]
        });

        localStorage.setItem(key, "true");
      }, 300); // 🔥 delay fixes overlap

      return () => clearTimeout(timer);
    }
  }
}, [isOpen, showCustomInfo]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      setMessages(res.data);
      
      // Group by date
      const grouped = res.data.reduce((acc, msg) => {
        const date = new Date(msg.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        });
        if (!acc[date]) acc[date] = [];
        acc[date].push(msg);
        return acc;
      }, {});
      setGroupedMessages(grouped);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setMessages(messages.map(msg => msg.id === id ? { ...msg, is_read: true } : msg));
      onMarkRead();
    } catch (err) {
      console.error("Failed to mark as read");
    }
  };

  const deleteMessage = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setMessages(messages.filter(msg => msg.id !== id));
      onMarkRead();
    } catch (err) {
      console.error("Failed to delete message");
    }
  };

  const getIconByType = (type) => {
    switch (type) {
      case 'critical':
        return <FaTimesCircle style={{ color: themeColors.danger }} />;
      case 'warning':
        return <FaExclamationTriangle style={{ color: themeColors.warning }} />;
      case 'reminder':
        return <FaInfoCircle style={{ color: themeColors.success }} />;
      case 'success':
        return <FaCheckCircle style={{ color: themeColors.success }} />;
      case 'error':
        return <FaTimesCircle style={{ color: themeColors.danger }} />;
      default:
        return <FaInfoCircle style={{ color: themeColors.accent }} />;
    }
  };

  if (!isOpen) return null;

  // Dynamic styles using themeColors
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
    zIndex: 99999, display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: '20px'
  };

  const popupStyle = {
    background: themeColors.cardBg,
    width: 'clamp(400px, 90vw, 600px)', 
    maxHeight: '90vh',
    borderRadius: '16px',
    border: `1px solid ${themeColors.border}`,
    overflow: 'hidden',
    boxShadow: theme === 'dark' ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.15)'
  };

  const headerStyle = {
    padding: '20px 24px',
    borderBottom: `1px solid ${themeColors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: themeColors.bgInner
  };

  const closeBtnStyle = {
    background: 'none',
    border: 'none',
    color: themeColors.textSecondary,
    fontSize: '20px',
    cursor: 'pointer',
    padding: 0,
    borderRadius: '4px',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s'
  };

  const contentStyle = { maxHeight: '70vh', overflowY: 'auto' };

  const dateSectionStyle = { padding: '0 24px 24px' };

  const dateHeaderStyle = { 
    color: themeColors.accent,
    fontSize: '14px',
    fontWeight: 600,
    margin: '24px 0 16px 0',
    paddingBottom: '8px',
    borderBottom: `1px solid ${themeColors.border}`
  };

  const messageStyle = (msg) => ({
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '12px',
    border: `1px solid ${themeColors.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: !msg.is_read
      ? msg.type === 'critical'
        ? `${themeColors.danger}20`
        : msg.type === 'warning'
        ? `${themeColors.warning}20`
        : msg.type === 'reminder'
        ? `${themeColors.success}20`
        : `${themeColors.accent}20`
      : 'transparent'
  });

  const iconStyle = { 
    width: 36,
    height: 36,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '2px'
  };

  const messageTitleStyle = {
    fontWeight: 600,
    color: themeColors.textPrimary,
    marginBottom: '4px'
  };

  const messageTypeStyle = {
    fontSize: '11px',
    color: themeColors.textSecondary,
    marginBottom: '4px'
  };

  const messageTextStyle = {
    color: themeColors.textSecondary,
    fontSize: '14px',
    lineHeight: '1.5'
  };

  const messageMetaStyle = { 
    color: themeColors.textSecondary,
    fontSize: '12px',
    marginTop: '8px'
  };

  const actionButtonsStyle = {
    display: 'flex',
    gap: '8px',
    flexDirection: 'column'
  };

  const readBtnStyle = {
    background: `linear-gradient(135deg, ${themeColors.success}, #16a34a)`,
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s'
  };

  const deleteBtnStyle = {
    background: 'transparent',
    color: themeColors.danger,
    border: `1px solid ${themeColors.danger}`,
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const loadingStyle = {
    padding: '60px 24px',
    textAlign: 'center',
    color: themeColors.textSecondary
  };

  const emptyStyle = {
    padding: '60px 24px',
    textAlign: 'center',
    color: themeColors.textSecondary
  };

  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBell size={24} color={themeColors.accent} />
            <h2 style={{ margin: 0, color: themeColors.textPrimary }}>Notifications</h2>
          </div>

          {/* RIGHT SIDE BUTTONS */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>

            {/* ℹ️ INFO BUTTON */}
            <button
              onClick={() =>
                showCustomInfo({
                  title: "Notifications Panel",
                  description:
                    "This panel shows all your notifications and system updates in real-time.",
                  sections: [
                    {
                      name: "Real-time Updates",
                      details: "Notifications are received instantly using socket connection."
                    },
                    {
                      name: "Unread Messages",
                      details: "Displays notifications you haven’t seen yet."
                    },
                    {
                      name: "Mark as Read",
                      details: "Allows you to clear notifications after viewing."
                    }
                  ]
                })
              }
              style={{
                background: themeColors.accentGlow,
                border: "none",
                color: themeColors.textPrimary,
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="About Notifications"
            >
              <FaInfoCircle />
            </button>

            {/* CLOSE BUTTON */}
            <button onClick={onClose} style={closeBtnStyle}>
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {loading ? (
            <div style={loadingStyle}>
              <div style={{ 
                width: '30px', 
                height: '30px', 
                border: `2px solid ${themeColors.border}`,
                borderTop: `2px solid ${themeColors.accent}`,
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite'
              }} />
              Loading messages...
            </div>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <div style={emptyStyle}>
              <FaBell size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No messages yet</p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} style={dateSectionStyle}>
                <h3 style={dateHeaderStyle}>{date}</h3>
                {msgs.map(msg => (
                  <div key={msg.id} style={messageStyle(msg)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={iconStyle}>
                        {getIconByType(msg.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={messageTitleStyle}>{msg.title}</div>
                        <div style={messageTypeStyle}>
                          {msg.type?.toUpperCase()}
                        </div>
                        <div style={messageTextStyle}>{msg.message}</div>
                        <div style={messageMetaStyle}>
                          {msg.sender_name && `From: ${msg.sender_name} • `}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={actionButtonsStyle}>
                        {!msg.is_read && (
                          <button 
                            onClick={() => markAsRead(msg.id)}
                            style={readBtnStyle}
                          >
                            Mark Read
                          </button>
                        )}
                        <button 
                          onClick={() => deleteMessage(msg.id)}
                          style={deleteBtnStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MessagePopup;