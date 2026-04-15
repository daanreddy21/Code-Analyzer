// src/components/chat/ChatList.jsx
import { useState } from "react";
import Avatar from "../common/Avatar";

function ChatList({ chats, openChat, activeChatId }) {
  const [activeTab, setActiveTab] = useState("admins");
  const [search, setSearch] = useState("");

  const admins = chats.filter(u => u.role === "admin");
  const users = chats.filter(u => u.role !== "admin");

  const displayList = activeTab === "admins" ? admins : users;

  const filteredList = displayList.filter(user =>
    (user.first_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Theme Constants
  const colors = {
    bg: "#0f172a",         // Slate 950
    surface: "#1e293b",    // Slate 800
    border: "#334155",     // Slate 700
    textMain: "#f8fafc",   // Slate 50
    textMuted: "#94a3b8",  // Slate 400
    accent: "#38bdf8",     // Sky 400
    unread: "#22c55e",     // Green 500
    hover: "#1e293b"       // Slate 800
  };

  return (
    <div style={{
      width: "350px",
      minWidth: "300px",
      height: "100vh",
      borderRight: `1px solid ${colors.border}`,
      background: colors.bg,
      color: colors.textMain,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* HEADER */}
      <div style={{ 
        padding: "24px 20px 10px 20px", 
        fontWeight: "700", 
        fontSize: "22px",
        letterSpacing: "-0.5px" 
      }}>
        Messages
      </div>

      {/* SEARCH */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              paddingLeft: "35px",
              borderRadius: "10px",
              background: "#1e293b",
              border: `1px solid ${colors.border}`,
              color: "white",
              fontSize: "14px",
              outline: "none",
              transition: "border 0.2s"
            }}
            onFocus={(e) => e.target.style.border = `1px solid ${colors.accent}`}
            onBlur={(e) => e.target.style.border = `1px solid ${colors.border}`}
          />
          <span style={{ position: "absolute", left: "12px", top: "10px", color: colors.textMuted }}>
            🔍
          </span>
        </div>
      </div>

      {/* TABS */}
      <div style={{ 
        display: "flex", 
        margin: "0 16px 12px 16px", 
        background: "#111827", 
        borderRadius: "8px", 
        padding: "4px" 
      }}>
        {["admins", "users"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "8px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: activeTab === tab ? colors.surface : "transparent",
              color: activeTab === tab ? colors.textMain : colors.textMuted,
              border: "none",
              textTransform: "capitalize"
            }}
          >
            {tab === "admins" ? "👑 Admins" : "👤 Users"}
          </button>
        ))}
      </div>

      {/* USER LIST */}
      <div style={{ 
        overflowY: "auto", 
        flex: 1,
        scrollbarWidth: "thin",
        scrollbarColor: `${colors.border} transparent`
      }}>
        {filteredList.length > 0 ? (
          filteredList.map(user => (
            <div
              key={user.id}
              onClick={() => openChat(user)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 16px",
                cursor: "pointer",
                transition: "background 0.2s ease",
                background: activeChatId === user.id ? "#1e293b" : "transparent",
                borderLeft: activeChatId === user.id ? `3px solid ${colors.accent}` : "3px solid transparent"
              }}
              onMouseEnter={(e) => {
                if(activeChatId !== user.id) e.currentTarget.style.background = "#1e293b66";
              }}
              onMouseLeave={(e) => {
                if(activeChatId !== user.id) e.currentTarget.style.background = "transparent";
              }}
            >
              <Avatar 
                name={user.first_name} 
                image={user.profile_image} 
                size={48}
              />

              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "2px"
                }}>
                  <span style={{ fontWeight: "600", fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.first_name}
                  </span>
                  <span style={{ fontSize: "11px", color: colors.textMuted }}>
                    {/* Placeholder for time */} 12:45 PM
                  </span>
                </div>

                <div style={{ 
                  fontSize: "13px", 
                  color: user.unread > 0 ? colors.textMain : colors.textMuted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontWeight: user.unread > 0 ? "500" : "400"
                }}>
                  {user.unread > 0 ? "Sent a message" : "Tap to open chat"}
                </div>
              </div>

              {user.unread > 0 && (
                <div style={{
                  background: colors.unread,
                  color: "white",
                  borderRadius: "12px",
                  minWidth: "20px",
                  height: "20px",
                  padding: "0 6px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }}>
                  {user.unread}
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.textMuted }}>
            No {activeTab} found
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatList;