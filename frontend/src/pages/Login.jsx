import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { 
  FaEnvelope, 
  FaLock, 
  FaUser, 
  FaArrowRight,
  FaCode,
  FaShieldAlt,
  FaRocket
} from "react-icons/fa";

function Login({ isOpen, onClose, onSwitchToRegister }) {
  const navigate = useNavigate();
  const { themeColors, theme } = useTheme();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [direction, setDirection] = useState("in"); // For transition animation

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

  const handleSwitchToRegister = () => {
    setDirection("out-left");
    setTimeout(() => {
      onSwitchToRegister();
      setDirection("in");
    }, 300);
  };

  if (!isOpen) return null;

  const features = [
    { icon: <FaCode />, text: "AI-Powered Code Analysis" },
    { icon: <FaShieldAlt />, text: "Security Vulnerability Detection" },
    { icon: <FaRocket />, text: "Real-time Bug Detection" }
  ];

  const getAnimationStyle = () => {
    switch(direction) {
      case "out-left":
        return { animation: "slideOutLeft 0.3s ease forwards" };
      case "in":
        return { animation: "slideInLeft 0.3s ease" };
      default:
        return {};
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme === 'dark' ? 'rgba(10, 10, 26, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease"
      }}
      onClick={onClose}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1100px",
          height: "650px",
          background: themeColors.cardBg,
          borderRadius: "24px",
          border: `1px solid ${themeColors.border}`,
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          overflow: "hidden",
          animation: "slideUp 0.4s ease"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT SECTION - Dynamic Content */}
        <div
          style={{
            flex: 1,
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden"
          }}
        >
          {/* Animated Background Elements */}
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            animation: "rotate 20s linear infinite"
          }} />
          
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" }}>
              <FaCode size={32} color="#fff" />
              <span style={{ fontSize: "24px", fontWeight: "700", color: "#fff" }}>CodeAnalyzer AI</span>
            </div>
            
            <h2 style={{ fontSize: "32px", fontWeight: "700", color: "#fff", marginBottom: "16px" }}>
              Welcome Back!
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", lineHeight: "1.6", marginBottom: "32px" }}>
              Sign in to continue your journey of writing cleaner, more secure, and efficient code with our AI-powered analysis tools.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {features.map((feature, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: "12px", animation: `slideInRight 0.5s ease ${index * 0.1}s both` }}>
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    background: "rgba(255,255,255,0.2)", 
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {feature.icon}
                  </div>
                  <span style={{ color: "#fff", fontSize: "14px" }}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ marginTop: "40px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>50K+</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Active Users</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>98%</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>Satisfaction</div>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{ fontSize: "28px", fontWeight: "700", color: "#fff" }}>24/7</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)" }}>AI Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION - Login Form */}
        <div
          style={{
            flex: 1,
            padding: "48px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            background: themeColors.cardBg,
            ...getAnimationStyle()
          }}
        >
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: themeColors.textPrimary, marginBottom: "8px" }}>
              Sign In
            </h2>
            <p style={{ color: themeColors.textSecondary, fontSize: "14px" }}>
              Access your account and start analyzing
            </p>
          </div>

          {error && (
            <div style={{
              background: `${themeColors.danger}20`,
              color: themeColors.danger,
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "24px",
              fontSize: "13px",
              border: `1px solid ${themeColors.danger}40`,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "shake 0.3s ease"
            }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ 
                display: 'block', 
                color: themeColors.textSecondary, 
                marginBottom: '8px', 
                fontSize: '13px',
                fontWeight: "500"
              }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <FaEnvelope style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: themeColors.textSecondary,
                  fontSize: "14px"
                }} />
                <input
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    background: themeColors.inputBg,
                    color: themeColors.textPrimary,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                  onBlur={(e) => e.target.style.borderColor = themeColors.border}
                />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ 
                display: 'block', 
                color: themeColors.textSecondary, 
                marginBottom: '8px', 
                fontSize: '13px',
                fontWeight: "500"
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <FaLock style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: themeColors.textSecondary,
                  fontSize: "14px"
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "12px 12px 12px 40px",
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "10px",
                    fontSize: "14px",
                    background: themeColors.inputBg,
                    color: themeColors.textPrimary,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = themeColors.accent}
                  onBlur={(e) => e.target.style.borderColor = themeColors.border}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: themeColors.textSecondary,
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
              {!loading && <FaArrowRight size={14} />}
            </button>
          </form>

          <div style={{ 
            textAlign: "center", 
            marginTop: "24px",
            paddingTop: "20px",
            borderTop: `1px solid ${themeColors.border}`
          }}>
            <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: "13px" }}>
              New to CodeAnalyzer?{" "}
              <button
                onClick={handleSwitchToRegister}
                style={{
                  background: "none",
                  border: "none",
                  color: themeColors.accent,
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "13px"
                }}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50px);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

export default Login;