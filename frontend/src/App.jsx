import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Analyzer from "./pages/Analyzer";
import History from "./pages/History";
import CodeCompare from "./pages/CodeCompare";
import AdminDashboard from "./pages/AdminDashboard";
import FileList from "./pages/FileList";
import ExplainPage from "./pages/ExplainPage";
import CodeRunnerPage from "./pages/CodeRunnerPage";
import Profile from "./pages/Profile";
import AdminProfile from "./pages/AdminProfile";
import AdminStudentProgress from "./pages/AdminStudentProgress";
import SavedCodesPage from "./pages/SavedCodesPage";
import SharePage from "./pages/SharePage";

// 🔥 ADD THIS IMPORT
import ChatPage from "./pages/ChatPage";

// 🔒 Simple Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token || token === "undefined" || token === "null") {
    return <Login />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🌐 Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* 🔐 Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}/>

        <Route path="/analyzer" element={<ProtectedRoute><Analyzer /></ProtectedRoute>}/>
          
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>}/>
          
        <Route path="/compare" element={<ProtectedRoute><CodeCompare /></ProtectedRoute>}/>    

        <Route path="/files" element={<ProtectedRoute><FileList /></ProtectedRoute>}/>

        <Route path="/explain" element={<ProtectedRoute><ExplainPage /></ProtectedRoute>}/>
          
        <Route path="/code-runner" element={<ProtectedRoute><CodeRunnerPage /></ProtectedRoute>}/>

        {/* 👤 Profile Route */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>}/>

        <Route path="/share/:token" element={<SharePage />} />

        <Route path="/saved-codes" element={<SavedCodesPage />} />

        {/* 🔥 CHAT ROUTE (IMPORTANT FIX) */}
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>}/>
          
        {/* 🔑 Admin Route */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
          
        <Route path="/admin/profile" element={<ProtectedRoute><AdminProfile /></ProtectedRoute>}/>

        <Route path="/admin/students" element={<ProtectedRoute><AdminStudentProgress /></ProtectedRoute>}/>


        {/* ❌ Fallback */}
        <Route path="*" element={<h2>404 - Page Not Found</h2>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;