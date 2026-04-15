// src/components/chat/MessageInput.jsx
import { useState, useRef } from "react";
import API from "../../services/api";
import socket from "../../services/socket";

function MessageInput({ chat, setMessages }) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef(null);

  const theme = {
    inputBg: "#1e293b",
    border: "#334155",
    accent: "#3b82f6",
    textMain: "#f8fafc"
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    socket.emit("stopTyping", { receiverId: chat.id });

    try {
      const res = await API.post("/chat/send", {
        conversationId: chat.conversation_id,
        message: text
      });

      const newMessage = { ...res.data, isMine: true };

      setMessages(prev => [...prev, newMessage]);

      socket.emit("sendMessage", {
        receiverId: chat.id,
        message: text,
        conversationId: chat.conversation_id
      });

      setText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    socket.emit("typing", { receiverId: chat.id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", { receiverId: chat.id });
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <form
      onSubmit={handleSendMessage}
      style={{
        display: "flex",
        gap: "10px",
        background: theme.inputBg,
        padding: "10px",
        borderRadius: "10px"
      }}
    >
      <input
        value={text}
        onChange={handleTyping}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          color: theme.textMain
        }}
      />

      <button
        type="submit"
        disabled={!text.trim()}
        style={{
          background: text.trim() ? theme.accent : "#334155",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "8px",
          cursor: text.trim() ? "pointer" : "not-allowed",
          opacity: text.trim() ? 1 : 0.5
        }}
      >
        Send ✈
      </button>
    </form>
  );
}

export default MessageInput;