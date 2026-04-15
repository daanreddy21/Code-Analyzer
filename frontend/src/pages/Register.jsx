import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await API.post("/auth/register", form);
      alert("✅ Registration Successful! Please login.");
      onClose();
      onSwitchToLogin();
    } catch (error) {
      setError(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(13, 17, 23, 0.85)", 
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000, padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: "#161b22", 
          width: "90%", maxWidth: "400px", 
          borderRadius: "12px",
          border: "1px solid #30363d",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          overflow: "hidden",
          maxHeight: "90vh",
          animation: "slideIn 0.3s ease-out"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          padding: "30px 40px 10px", 
          textAlign: "center",
          position: "relative"
        }}>
          <button 
            onClick={onClose} 
            style={{
              position: "absolute", top: "15px", right: "15px",
              background: "none", border: "none", fontSize: "20px",
              color: "#8b949e", cursor: "pointer"
            }}
          >
            ×
          </button>
          <h2 style={{ 
            margin: 0, color: "#f0f6fc", 
            fontSize: "24px", fontWeight: "600"
          }}>
            Create Account
          </h2>
          <p style={{ color: "#8b949e", margin: "8px 0 0 0", fontSize: "14px" }}>
            Join AI Code Analyzer today!
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "30px 40px 40px" }}>
          {error && (
            <div style={{
                background: "rgba(248, 81, 73, 0.1)",
                color: "#f85149",
                padding: "10px 12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                border: "1px solid rgba(248, 81, 73, 0.4)",
            }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: 'block', color: '#f0f6fc', marginBottom: '8px', fontSize: '14px' }}>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
                style={{
                  width: "100%", padding: "12px 16px",
                  border: "1px solid #30363d", borderRadius: "6px",
                  fontSize: "14px", background: "#0d1117",
                  color: "#c9d1d9", outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#58a6ff"}
                onBlur={(e) => e.target.style.borderColor = "#30363d"}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: 'block', color: '#f0f6fc', marginBottom: '8px', fontSize: '14px' }}>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%", padding: "12px 16px",
                  border: "1px solid #30363d", borderRadius: "6px",
                  fontSize: "14px", background: "#0d1117",
                  color: "#c9d1d9", outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#58a6ff"}
                onBlur={(e) => e.target.style.borderColor = "#30363d"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: 'block', color: '#f0f6fc', marginBottom: '8px', fontSize: '14px' }}>Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%", padding: "12px 16px",
                  border: "1px solid #30363d", borderRadius: "6px",
                  fontSize: "14px", background: "#0d1117",
                  color: "#c9d1d9", outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#58a6ff"}
                onBlur={(e) => e.target.style.borderColor = "#30363d"}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: "100%", padding: "12px",
                background: "#238636",
                color: "#ffffff", border: "1px solid rgba(240, 246, 252, 0.1)",
                borderRadius: "6px", fontSize: "14px",
                fontWeight: "600", cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#2ea043")}
              onMouseOut={(e) => !loading && (e.target.style.background = "#238636")}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div style={{ 
            textAlign: "center", 
            marginTop: "24px", 
            paddingTop: "20px",
            borderTop: "1px solid #30363d"
          }}>
            <p style={{ color: "#8b949e", margin: 0, fontSize: "14px" }}>
              Already have an account? 
              <button 
                onClick={onSwitchToLogin}
                style={{
                  background: "none", border: "none",
                  color: "#58a6ff", fontWeight: "500",
                  cursor: "pointer", fontSize: "14px", marginLeft: "5px"
                }}
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Register;