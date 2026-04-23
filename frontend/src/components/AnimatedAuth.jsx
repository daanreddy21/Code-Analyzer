// src/components/AnimatedAuth.jsx
import { useState, useEffect, useRef } from "react";
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
  FaRocket,
  FaCheckCircle,
  FaTimes
} from "react-icons/fa";

function AnimatedAuth({ isOpen, onClose, onSwitchToRegister, onSwitchToLogin, initialMode = "login" }) {
  const navigate = useNavigate();
  const { themeColors, theme } = useTheme();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const modalRef = useRef(null);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => document.removeEventListener("keydown", handleEscKey);
  }, [isOpen, onClose]);

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", loginForm);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (onClose) onClose();
      
      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions");
      return;
    }
    setLoading(true);
    setError("");

    try {
      await API.post("/auth/register", registerForm);
      alert("✅ Registration Successful! Please login.");
      handleSwitchToLogin();
    } catch (error) {
      setError(error.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsLogin(false);
    setError("");
    setTimeout(() => {
      setIsAnimating(false);
      if (onSwitchToRegister) onSwitchToRegister();
    }, 500);
  };

  const handleSwitchToLogin = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsLogin(true);
    setError("");
    setTimeout(() => {
      setIsAnimating(false);
      if (onSwitchToLogin) onSwitchToLogin();
    }, 500);
  };

  if (!isOpen) return null;

  // Content for left panel (Login mode)
  const loginLeftContent = {
    title: "Welcome Back!",
    subtitle: "Sign in to continue your journey of writing cleaner, more secure, and efficient code with our AI-powered analysis tools.",
    features: [
      { icon: <FaCode />, text: "AI-Powered Code Analysis" },
      { icon: <FaShieldAlt />, text: "Security Vulnerability Detection" },
      { icon: <FaRocket />, text: "Real-time Bug Detection" }
    ],
    stats: [
      { number: "50K+", label: "Active Users" },
      { number: "98%", label: "Satisfaction Rate" },
      { number: "24/7", label: "AI Support" }
    ],
    switchText: "Don't have an account?",
    switchButton: "Create Account"
  };

  // Content for left panel (Register mode)
  const registerLeftContent = {
    title: "Join Our Community",
    subtitle: "Create your free account and start analyzing your code with AI. Join thousands of developers worldwide.",
    benefits: [
      { icon: <FaCheckCircle />, text: "Free forever — no credit card required" },
      { icon: <FaCheckCircle />, text: "Analyze unlimited code snippets" },
      { icon: <FaCheckCircle />, text: "Access to AI-powered insights" }
    ],
    testimonial: {
      text: '"CodeAnalyzer AI helped me reduce bugs by 70% in my projects!"',
      author: "— Senior Developer at Tech Corp"
    },
    switchText: "Already have an account?",
    switchButton: "Sign In"
  };

  const leftContent = isLogin ? loginLeftContent : registerLeftContent;

  return (
    <div className="auth-wrapper" style={{ background: theme === 'dark' ? 'rgba(10, 10, 26, 0.98)' : 'rgba(0, 0, 0, 0.85)' }}>
      <div className="auth-container" ref={modalRef}>
        <div className={`auth-card ${isAnimating ? 'animating' : ''}`}>
          
          {/* LEFT PANEL - Dynamic Content */}
          <div className={`auth-info ${isAnimating ? (isLogin ? 'slide-out-right' : 'slide-out-left') : ''}`} style={{ background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)` }}>
            {/* Close Button */}
            <button className="close-btn" onClick={onClose}>
              <FaTimes />
            </button>
            
            <div className="info-content">
              <div className="brand">
                <div className="brand-icon-wrapper">
                  <FaCode className="brand-icon" />
                </div>
                <h2>CodeAnalyzer AI</h2>
              </div>
              
              <div className="welcome-text">
                <h3>{leftContent.title}</h3>
                <p>{leftContent.subtitle}</p>
              </div>
              
              {isLogin ? (
                <>
                  <div className="features-list">
                    {leftContent.features.map((feature, index) => (
                      <div className="feature-item" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="feature-icon-wrapper">{feature.icon}</div>
                        <span>{feature.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="stats-grid">
                    {leftContent.stats.map((stat, index) => (
                      <div className="stat-card" key={index}>
                        <div className="stat-number">{stat.number}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="benefits-list">
                    {leftContent.benefits.map((benefit, index) => (
                      <div className="benefit-item" key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="benefit-icon-wrapper">{benefit.icon}</div>
                        <span>{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="testimonial-card">
                    <p>{leftContent.testimonial.text}</p>
                    <div className="testimonial-author">
                      <div className="author-avatar">👨‍💻</div>
                      <span>{leftContent.testimonial.author}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="switch-prompt">
              <p>{leftContent.switchText}</p>
              <button 
                className="switch-btn" 
                onClick={isLogin ? handleSwitchToRegister : handleSwitchToLogin}
                disabled={isAnimating}
              >
                {leftContent.switchButton}
                <FaArrowRight className="switch-icon" />
              </button>
            </div>
          </div>

          {/* RIGHT PANEL - Form */}
          <div className={`auth-form ${isAnimating ? (isLogin ? 'slide-in-left' : 'slide-in-right') : ''}`} style={{ background: themeColors.cardBg }}>
            <div className="form-container">
              <div className="form-header">
                <div className="form-header-badge">
                  {isLogin ? "🔐 Secure Login" : "📝 Get Started"}
                </div>
                <h2 style={{ color: themeColors.textPrimary }}>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                <p style={{ color: themeColors.textSecondary }}>
                  {isLogin ? 'Access your personalized dashboard' : 'Start your free journey today'}
                </p>
              </div>

              {error && (
                <div className="error-message" style={{ background: `${themeColors.danger}20`, color: themeColors.danger, borderLeft: `4px solid ${themeColors.danger}` }}>
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              {isLogin ? (
                // LOGIN FORM
                <form onSubmit={handleLogin}>
                  <div className="input-group">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      required
                      style={{ background: themeColors.inputBg, borderColor: themeColors.border, color: themeColors.textPrimary }}
                    />
                  </div>
                  <div className="input-group">
                    <FaLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      required
                      style={{ background: themeColors.inputBg, borderColor: themeColors.border, color: themeColors.textPrimary }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  
                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" /> Remember me
                    </label>
                    <a href="#" className="forgot-password">Forgot Password?</a>
                  </div>
                  
                  <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Sign In <FaArrowRight className="btn-icon" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // REGISTER FORM
                <form onSubmit={handleRegister}>
                  <div className="input-group">
                    <FaUser className="input-icon" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      required
                      style={{ background: themeColors.inputBg, borderColor: themeColors.border, color: themeColors.textPrimary }}
                    />
                  </div>
                  <div className="input-group">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      required
                      style={{ background: themeColors.inputBg, borderColor: themeColors.border, color: themeColors.textPrimary }}
                    />
                  </div>
                  <div className="input-group">
                    <FaLock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      required
                      style={{ background: themeColors.inputBg, borderColor: themeColors.border, color: themeColors.textPrimary }}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="terms-checkbox">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    <label htmlFor="terms">
                      I agree to the <span>Terms & Conditions</span> and <span>Privacy Policy</span>
                    </label>
                  </div>
                  <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <>
                        Create Account <FaArrowRight className="btn-icon" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .auth-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(8px);
          animation: fadeIn 0.3s ease;
        }

        .auth-container {
          max-width: 1100px;
          width: 100%;
          overflow: hidden;
        }

        .auth-card {
          display: flex;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          width: 100%;
        }

        /* LEFT PANEL */
        .auth-info {
          flex: 1;
          padding: 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
          position: relative;
          overflow: hidden;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
          min-height: 650px;
        }

        .auth-info::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
          animation: rotate 25s linear infinite;
        }

        .auth-info::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          animation: rotateReverse 30s linear infinite;
        }

        @keyframes rotateReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        .info-content {
          position: relative;
          z-index: 1;
        }

        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.2);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.2s;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }

        /* Slide animations for LEFT panel */
        .auth-info.slide-out-right {
          transform: translateX(100%);
          opacity: 0;
        }

        .auth-info.slide-out-left {
          transform: translateX(-100%);
          opacity: 0;
        }

        /* RIGHT PANEL */
        .auth-form {
          flex: 1;
          padding: 48px;
          display: flex;
          align-items: center;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
        }

        /* Slide animations for RIGHT panel */
        .auth-form.slide-in-left {
          transform: translateX(-100%);
          opacity: 0;
          animation: slideInLeft 0.5s ease forwards;
        }

        .auth-form.slide-in-right {
          transform: translateX(100%);
          opacity: 0;
          animation: slideInRight 0.5s ease forwards;
        }

        @keyframes slideInLeft {
          0% { transform: translateX(-100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .brand-icon-wrapper {
          width: 45px;
          height: 45px;
          background: rgba(255,255,255,0.2);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .brand-icon {
          font-size: 24px;
        }

        .brand h2 {
          font-size: 24px;
          margin: 0;
          font-weight: 700;
        }

        .welcome-text {
          margin-bottom: 32px;
        }

        .auth-info h3 {
          font-size: 32px;
          margin-bottom: 12px;
          font-weight: 700;
        }

        .auth-info p {
          font-size: 14px;
          line-height: 1.6;
          opacity: 0.9;
        }

        .features-list, .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 32px;
        }

        .feature-item, .benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          animation: fadeInUp 0.5s ease both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-icon-wrapper, .benefit-icon-wrapper {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }

        .stats-grid {
          display: flex;
          gap: 20px;
          margin-top: 20px;
        }

        .stat-card {
          flex: 1;
          text-align: center;
          background: rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 16px 12px;
          backdrop-filter: blur(10px);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .stat-number {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.8;
        }

        .testimonial-card {
          background: rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 20px;
          margin-top: 16px;
          backdrop-filter: blur(10px);
        }

        .testimonial-card p {
          font-size: 13px;
          font-style: italic;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
        }

        .author-avatar {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .switch-prompt {
          text-align: center;
          margin-top: 32px;
          position: relative;
          z-index: 1;
        }

        .switch-prompt p {
          margin-bottom: 12px;
          font-size: 13px;
        }

        .switch-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          padding: 10px 24px;
          border-radius: 40px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .switch-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.3);
          transform: translateY(-2px);
        }

        .switch-icon {
          font-size: 12px;
          transition: transform 0.2s;
        }

        .switch-btn:hover .switch-icon {
          transform: translateX(4px);
        }

        /* FORM STYLES */
        .form-container {
          width: 100%;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header-badge {
          display: inline-block;
          background: ${themeColors.accentGlow};
          color: ${themeColors.accent};
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .form-header h2 {
          font-size: 28px;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .error-message {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 10px;
          animation: shake 0.3s ease;
        }

        .input-group {
          position: relative;
          margin-bottom: 20px;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 16px;
          opacity: 0.6;
        }

        .input-group input {
          width: 100%;
          padding: 14px 14px 14px 48px;
          border: 2px solid;
          border-radius: 14px;
          font-size: 14px;
          transition: all 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: ${themeColors.accent} !important;
          box-shadow: 0 0 0 4px ${themeColors.accentGlow};
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 12px;
          opacity: 0.6;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          font-size: 13px;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: ${themeColors.textSecondary};
        }

        .forgot-password {
          color: ${themeColors.accent};
          text-decoration: none;
        }

        .terms-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 20px 0;
        }

        .terms-checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .terms-checkbox label {
          font-size: 12px;
          cursor: pointer;
          color: ${themeColors.textSecondary};
        }

        .terms-checkbox label span {
          color: ${themeColors.accent};
          font-weight: 600;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, ${themeColors.accent}, #4c51bf);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px ${themeColors.accentGlow};
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-icon {
          font-size: 14px;
          transition: transform 0.2s;
        }

        .submit-btn:hover:not(:disabled) .btn-icon {
          transform: translateX(4px);
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Animations */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        /* Responsive */
        @media (max-width: 768px) {
          .auth-card {
            flex-direction: column;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .auth-info {
            padding: 32px;
            text-align: center;
            min-height: auto;
          }
          
          .auth-form {
            padding: 32px;
          }
          
          .features-list, .benefits-list {
            align-items: center;
          }
          
          .stats-grid {
            justify-content: center;
          }
          
          .brand {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

export default AnimatedAuth;