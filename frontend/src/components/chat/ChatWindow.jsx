// src/components/chat/ChatWindow.jsx
import { useEffect, useState, useRef } from "react";
import socket from "../../services/socket";
import MessageInput from "./MessageInput";
import Avatar from "../common/Avatar";

function ChatWindow({ chat, messages, setMessages }) {
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);
  const currentUserId = localStorage.getItem("userId");

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Socket listeners
  useEffect(() => {
    socket.on("typing", () => setIsTyping(true));
    socket.on("stopTyping", () => setIsTyping(false));

    socket.on("newMessage", (msg) => {
      setMessages(prev => [
        ...prev,
        {
          ...msg,
          isMine: String(msg.sender_id) === String(currentUserId)
        }
      ]);
    });

    return () => {
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("newMessage");
    };
  }, [currentUserId, setMessages]);

  const theme = {
    bg: "#0f172a",
    headerBg: "#0f172aee",
    bubbleMe: "#3b82f6",
    bubbleThem: "#1e293b",
    textMain: "#f8fafc",
    textMuted: "#94a3b8",
    border: "#1e293b",
    accent: "#38bdf8"
  };

  if (!chat) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.bg,
        color: theme.textMuted
      }}>
        Select a conversation
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: theme.bg,
      height: "100%",
        overflow: "hidden"
    }}>

      {/* HEADER */}
      <div style={{
        padding: "12px 20px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: theme.headerBg
      }}>
        <Avatar name={chat.first_name} image={chat.profile_image} size={40} />
        <div>
          <div style={{ fontWeight: "700" }}>
            {chat.first_name} {chat.role === "admin" && "👑"}
          </div>
          <div style={{
            fontSize: "12px",
            color: isTyping ? "#22c55e" : theme.textMuted
          }}>
            {isTyping ? "typing..." : "Online"}
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div
  ref={scrollRef}
  style={{
    flex: 1,
    overflowY: "auto",
    padding: "20px"
  }}
>
        {messages.map((msg, index) => {
          const isMine =
            msg.isMine ||
            String(msg.sender_id) === String(currentUserId);

          return (
            <div
              key={msg.id || index}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                marginBottom: "12px"
              }}
            >
              <div style={{
                background: isMine ? theme.bubbleMe : theme.bubbleThem,
                padding: "10px 16px",
                borderRadius: "12px",
                maxWidth: "60%",
                color: "white"
              }}>
                {msg.message}

                <div style={{
                  fontSize: "10px",
                  marginTop: "4px",
                  color: theme.textMuted,
                  textAlign: "right"
                }}>
                  {msg.created_at &&
                    new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  {isMine && (
                    <span style={{ marginLeft: "5px" }}>
                      {msg.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT */}
      <div style={{
        padding: "15px 20px",
        background: theme.bg,
        borderTop: `1px solid ${theme.border}`,
        flexShrink: 0     // ✅ IMPORTANT
        }}>
        <MessageInput chat={chat} setMessages={setMessages} />
      </div>
    </div>
  );
}

export default ChatWindow;