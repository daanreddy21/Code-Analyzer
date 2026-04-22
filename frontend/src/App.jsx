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
import { ThemeProvider } from "./context/ThemeContext"; // ✅ NEW

import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import AdminStudentProgress from "./pages/AdminStudentProgress";
import AdminLayout from "./components/admin/AdminLayout"; // ✅ NEW

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

// 🔥 USER LAYOUT
function LayoutWrapper() {
  const navigate = useNavigate();

  return (
    <Layout navigate={navigate}>
      <Routes>
        <Route path="dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="analyzer" element={<ProtectedRoute><Analyzer /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="compare" element={<ProtectedRoute><CodeCompare /></ProtectedRoute>} />
        <Route path="files" element={<ProtectedRoute><FileList /></ProtectedRoute>} />
        <Route path="explain" element={<ProtectedRoute><ExplainPage /></ProtectedRoute>} />
        <Route path="code-runner" element={<ProtectedRoute><CodeRunnerPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="saved-codes" element={<ProtectedRoute><SavedCodesPage /></ProtectedRoute>} />
        <Route path="share/:token" element={<SharePage />} />
      </Routes>
    </Layout>
  );
}

// 🔥 ADMIN LAYOUT WRAPPER
function AdminWrapper() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="students" element={<AdminStudentProgress />} />
      </Routes>
    </AdminLayout>
  );
}

function App() {
  return (
    <ThemeProvider> {/* 🔥 IMPORTANT */}
      <BrowserRouter>
        <Routes>

          {/* 🌐 PUBLIC */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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