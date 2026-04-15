// src/pages/ChatPage.jsx
import { useEffect, useState } from "react";
import API from "../services/api";
import socket from "../services/socket";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import Avatar from "../components/common/Avatar";

function ChatPage() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";

  const theme = {
    bg: "#020617",
    headerBg: "#0f172a",
    border: "#1e293b",
    textMain: "#f8fafc",
    accent: "#3b82f6"
  };

  // ✅ JOIN SOCKET ONLY
  useEffect(() => {
    socket.emit("join", userId);
  }, [userId]);

  // ✅ FETCH USERS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await API.get("/chat/users");
        setChats(res.data);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    fetchUsers();
  }, []);

  // ✅ OPEN CHAT
  const openChat = async (user) => {
    try {
      setMessages([]); // 🔥 clear old messages

      const convoRes = await API.post("/chat/conversation", {
        receiverId: user.id
      });

      const conversationId = convoRes.data.conversationId;

      setSelectedChat({
        ...user,
        conversation_id: conversationId,
        id: user.id // ✅ important fix
      });

      const msgRes = await API.get(`/chat/messages/${conversationId}`);

      const updatedMessages = msgRes.data.map(m => ({
        ...m,
        isMine: m.sender_id === userId
      }));

      setMessages(updatedMessages);

      await API.patch(`/chat/read/${conversationId}`);

    } catch (err) {
      console.error("Error opening chat:", err);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      background: theme.bg, 
      color: theme.textMain,
      overflow: "hidden" 
    }}>
      
      {/* HEADER */}
      <header style={{
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.border}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ 
            background: theme.accent, 
            width: "32px", 
            height: "32px", 
            borderRadius: "8px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: "bold" 
          }}>
            C
          </div>
          <span style={{ fontWeight: "700", fontSize: "18px" }}>
            ChatApp <span style={{ color: theme.accent }}>Pro</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "600" }}>{userName}</div>
            <div style={{ fontSize: "10px", color: "#22c55e" }}>● Online</div>
          </div>
          <Avatar name={userName} size={36} />
        </div>
      </header>

      {/* MAIN */}
      <main style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <ChatList 
          chats={chats} 
          openChat={openChat} 
          activeChatId={selectedChat?.id} 
        />
        <ChatWindow 
          chat={selectedChat} 
          messages={messages} 
          setMessages={setMessages} 
        />
      </main>

      {/* FOOTER */}
      <footer style={{
        height: "30px",
        background: "#020617",
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        fontSize: "11px",
        color: "#64748b"
      }}>
        <div>&copy; 2026 ChatApp</div>
        <div style={{ display: "flex", gap: "15px" }}>
          <span>Status: <b style={{color: "#22c55e"}}>Connected</b></span>
          <span>Latency: 24ms</span>
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;