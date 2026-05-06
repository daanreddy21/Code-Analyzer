import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analyzer from "./pages/Analyzer";
import History from "./pages/History";
import CodeCompare from "./pages/CodeCompare";
import FileList from "./pages/FileList";
import ExplainPage from "./pages/ExplainPage";
import CodeRunnerPage from "./pages/CodeRunnerPage";
import Profile from "./pages/Profile";
import SavedCodesPage from "./pages/SavedCodesPage";
import SharePage from "./pages/SharePage";
import Layout from "./components/Layout";
import ChatPage from "./pages/ChatPage";
import { ThemeProvider } from "./context/ThemeContext";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import AdminStudentProgress from "./pages/AdminStudentProgress";
import AdminLayout from "./components/admin/AdminLayout";


// 🔒 Protected Route
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/" replace />;
  }

  return children;
};


// 🛡️ Admin Route
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user || user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};


// 🔥 🔥 CHAT REDIRECT (IMPORTANT)
const ChatRedirect = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.role === "admin") {
    return <Navigate to="/admin/chat" replace />;
  }

  return <Navigate to="/chat/user" replace />;
};


// 🔥 USER LAYOUT
function LayoutWrapper() {
  const navigate = useNavigate();

  return (
    <Layout navigate={navigate}>
      <Routes>
<Route
          path="dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="saved-codes" element={<ProtectedRoute><SavedCodesPage /></ProtectedRoute>} />
        <Route path="share/:token" element={<SharePage />} />
      </Routes>
    </Layout>
  );
}



function AdminWrapper() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="*" element={<AdminDashboard />} />
        

        
        
      </Routes>
    </AdminLayout>
  );
}


function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          {/* 🌐 PUBLIC */}
          <Route path="/" element={<Landing />} />

          {/* 🔥 CHAT ENTRY POINT (IMPORTANT) */}
          <Route path="/chat" element={<ChatRedirect />} />

          {/* 🔥 ADMIN */}
          <Route path="/admin/*" element={
            <AdminRoute>
              <AdminWrapper />
            </AdminRoute>
          } />

          {/* 🔐 USER */}
          <Route path="/*" element={<LayoutWrapper />} />

          {/* ❌ FALLBACK */}
          <Route path="*" element={<h2>404 - Page Not Found</h2>} />

        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;