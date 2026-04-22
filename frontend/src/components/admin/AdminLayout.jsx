import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminFooter from "./AdminFooter";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const { themeColors } = useTheme();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await API.get("/chat/unread");
        setUnread(res.data.unread);
      } catch (err) {
        console.error(err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-layout">
      {/* ✅ HEADER */}
      <AdminHeader navigate={navigate} unread={unread} />

      {/* ✅ CONTENT */}
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