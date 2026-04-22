import { useState, useEffect } from "react";
import { 
  FaBell, 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaInfoCircle,
  FaExclamationTriangle   // 🔥 ADD THIS
} from "react-icons/fa";
import API from "../services/api";

const MessagePopup = ({ isOpen, onClose, onMarkRead }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupedMessages, setGroupedMessages] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

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
      return <FaTimesCircle style={{ color: '#ff4d4f' }} />; // 🔴

    case 'warning':
      return <FaExclamationTriangle style={{ color: '#faad14' }} />; // 🟡

    case 'reminder':
      return <FaInfoCircle style={{ color: '#52c41a' }} />; // 🟢

    case 'success':
      return <FaCheckCircle style={{ color: '#238636' }} />;

    case 'error':
      return <FaTimesCircle style={{ color: '#f85149' }} />;

    default:
      return <FaInfoCircle style={{ color: '#58a6ff' }} />;
  }
};
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={popupStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaBell size={24} />
            <h2 style={{ margin: 0, color: '#fff' }}>Notifications</h2>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {loading ? (
            <div style={loadingStyle}>Loading messages...</div>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <div style={emptyStyle}>No messages yet</div>
          ) : (
            Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} style={dateSectionStyle}>
                <h3 style={dateHeaderStyle}>{date}</h3>
                {msgs.map(msg => (
                  <div key={msg.id} style={{
                    ...messageStyle,
                    background: !msg.is_read
                      ? msg.type === 'critical'
                        ? '#ff4d4f20'
                        : msg.type === 'warning'
                        ? '#faad1420'
                        : msg.type === 'reminder'
                        ? '#52c41a20'
                        : '#23863620'
                      : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={iconStyle}>
                        {getIconByType(msg.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={messageTitleStyle}>{msg.title}</div>

                        {/* 🔥 ADD THIS */}
                        <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>
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
    </div>
  );
};

// Styles
const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '20px'
};

const popupStyle = {
  background: '#161b22', width: 'clamp(400px, 90vw, 600px)', 
  maxHeight: '90vh', borderRadius: '12px', border: '1px solid #30363d',
  overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
};

const headerStyle = {
  padding: '20px 24px', borderBottom: '1px solid #30363d',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};

const closeBtnStyle = {
  background: 'none', border: 'none', color: '#8b949e', 
  fontSize: '20px', cursor: 'pointer', padding: 0, borderRadius: '4px',
  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'color 0.2s'
};

const contentStyle = { maxHeight: '70vh', overflowY: 'auto' };

const dateSectionStyle = { padding: '0 24px 24px' };
const dateHeaderStyle = { 
  color: '#58a6ff', fontSize: '14px', fontWeight: 600, 
  margin: '24px 0 16px 0', paddingBottom: '8px', 
  borderBottom: '1px solid #30363d'
};

const messageStyle = {
  padding: '16px', borderRadius: '8px', marginBottom: '12px',
  border: '1px solid #30363d', cursor: 'pointer',
  transition: 'all 0.2s'
};

const iconStyle = { 
  width: 36, height: 36, borderRadius: '6px', 
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, marginTop: '2px'
};

const messageTitleStyle = { fontWeight: 600, color: '#fff', marginBottom: '4px' };
const messageTextStyle = { color: '#c9d1d9', fontSize: '14px', lineHeight: '1.5' };
const messageMetaStyle = { 
  color: '#8b949e', fontSize: '12px', marginTop: '8px' 
};

const actionButtonsStyle = { display: 'flex', gap: '8px', flexDirection: 'column' };
const readBtnStyle = {
  background: '#238636', color: 'white', border: 'none',
  padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
  cursor: 'pointer'
};
const deleteBtnStyle = {
  background: 'transparent', color: '#f85149', border: '1px solid #f85149',
  padding: '6px 12px', borderRadius: '4px', fontSize: '12px',
  cursor: 'pointer'
};

const loadingStyle = { padding: '60px 24px', textAlign: 'center', color: '#8b949e' };
const emptyStyle = { padding: '60px 24px', textAlign: 'center', color: '#8b949e' };

export default MessagePopup;