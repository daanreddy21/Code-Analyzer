import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login({ isOpen, onClose, onSwitchToRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", form); 
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      onClose();

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Invalid credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(13, 17, 23, 0.85)", // Darker backdrop
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#161b22", // Matches Dashboard cards
          width: "90%",
          maxWidth: "400px",
          borderRadius: "12px",
          border: "1px solid #30363d", // Matches Dashboard borders
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          overflow: "hidden",
          maxHeight: "90vh",
          animation: "slideIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "30px 40px 10px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "15px",
              right: "15px",
              background: "none",
              border: "none",
              fontSize: "20px",
              color: "#8b949e",
              cursor: "pointer",
            }}
          >
            ×
          </button>
          <h2
            style={{
              margin: 0,
              color: "#f0f6fc",
              fontSize: "24px",
              fontWeight: "600",
            }}
          >
            Sign In
          </h2>
          <p
            style={{
              color: "#8b949e",
              margin: "8px 0 0 0",
              fontSize: "14px",
            }}
          >
            Welcome back to AI Code Analyzer
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: "30px 40px 40px" }}>
          {error && (
            <div
              style={{
                background: "rgba(248, 81, 73, 0.1)",
                color: "#f85149",
                padding: "10px 12px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "14px",
                border: "1px solid rgba(248, 81, 73, 0.4)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: 'block', color: '#f0f6fc', marginBottom: '8px', fontSize: '14px' }}>Email</label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "#0d1117",
                  color: "#c9d1d9",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#58a6ff"}
                onBlur={(e) => e.target.style.borderColor = "#30363d"}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ color: '#f0f6fc', fontSize: '14px' }}>Password</label>
              </div>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  fontSize: "14px",
                  background: "#0d1117",
                  color: "#c9d1d9",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#58a6ff"}
                onBlur={(e) => e.target.style.borderColor = "#30363d"}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#238636", // Success Green from Dashboard
                color: "#ffffff",
                border: "1px solid rgba(240, 246, 252, 0.1)",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                opacity: loading ? 0.7 : 1,
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = "#2ea043")}
              onMouseOut={(e) => !loading && (e.target.style.background = "#238636")}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "24px",
              paddingTop: "20px",
              borderTop: "1px solid #30363d",
            }}
          >
            <p
              style={{
                color: "#8b949e",
                margin: 0,
                fontSize: "14px",
              }}
            >
              New here?{" "}
              <button
                onClick={onSwitchToRegister}
                style={{
                  background: "none",
                  border: "none",
                  color: "#58a6ff",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Login;