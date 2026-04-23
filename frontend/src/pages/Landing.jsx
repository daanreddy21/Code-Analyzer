import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AnimatedAuth from "../components/AnimatedAuth";
import { useTheme } from "../context/ThemeContext";
import { 
  FaCode, 
  FaShieldAlt, 
  FaChartLine, 
  FaHistory, 
  FaBrain, 
  FaRocket,
  FaGithub,
  FaTwitter,
  FaLinkedin,
  FaMoon,
  FaSun,
  FaUserPlus,
  FaSignInAlt,
  FaArrowDown,
  FaCheckCircle,
  FaBug,
  FaTachometerAlt
} from "react-icons/fa";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [typedText, setTypedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  
  const { theme, toggleTheme, themeColors } = useTheme();

  const fullTexts = [
    "AI Code Quality & Bug Detector",
    "Real-time Vulnerability Scanner",
    "Smart Code Analysis Platform"
  ];
  const [textIndex, setTextIndex] = useState(0);
  const fullText = fullTexts[textIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting && currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else if (isDeleting && currentIndex > 0) {
        setTypedText(fullText.slice(0, currentIndex - 1));
        setCurrentIndex(currentIndex - 1);
      } else if (!isDeleting && currentIndex === fullText.length) {
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && currentIndex === 0) {
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % fullTexts.length);
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting, fullText]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 5 + 2,
      speed: Math.random() * 0.8 + 0.3,
      opacity: Math.random() * 0.4 + 0.2,
      delay: Math.random() * 10
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  const openLogin = () => {
    setAuthMode("login");
    setShowAuth(true);
  };

  const openRegister = () => {
    setAuthMode("register");
    setShowAuth(true);
  };

  const closeAuth = () => {
    setShowAuth(false);
  };

  const features = [
    { icon: <FaShieldAlt />, title: "Security First", description: "Detects SQL injection, XSS, eval() risks, and 50+ vulnerabilities", color: "#ef4444" },
    { icon: <FaChartLine />, title: "Code Quality Score", description: "Get actionable metrics: complexity, functions, lines, and fix suggestions", color: "#48bb78" },
    { icon: <FaHistory />, title: "History & Dashboard", description: "Track improvements over time with detailed analytics", color: "#5a67d8" },
    { icon: <FaBrain />, title: "AI-Powered Insights", description: "Smart suggestions and behavior prediction for better code", color: "#ed8936" },
    { icon: <FaBug />, title: "Bug Detection", description: "Identify critical bugs before they reach production", color: "#f56565" },
    { icon: <FaTachometerAlt />, title: "Performance Metrics", description: "Measure code complexity, maintainability, and efficiency", color: "#4299e1" }
  ];

  return (
    <div className="landing-container" style={{ background: themeColors.background }}>
      {/* ==================== HEADER ==================== */}
      <header className="landing-header" style={{ 
        background: theme === 'dark' ? 'rgba(17, 17, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${themeColors.border}`
      }}>
        <div className="header-content">
          <div className="logo">
            <FaCode className="logo-icon" style={{ color: themeColors.accent }} />
            <span className="logo-text" style={{ background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.success})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              CodeAnalyzer AI
            </span>
          </div>
          
          <nav className="nav-links">
            <a href="#hero" className="nav-link" style={{ 
              color: themeColors.textPrimary,
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}>Home</a>
            <a href="#features" className="nav-link" style={{ 
              color: themeColors.textPrimary,
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}>Features</a>
            <a href="#stats" className="nav-link" style={{ 
              color: themeColors.textPrimary,
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}>Stats</a>
            <a href="#cta" className="nav-link" style={{ 
              color: themeColors.textPrimary,
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              padding: "8px 16px",
              borderRadius: "8px",
              transition: "all 0.2s ease"
            }}>Get Started</a>
          </nav>

          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme} style={{ 
              background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              color: themeColors.textPrimary
            }}>
              {theme === "dark" ? <FaSun /> : <FaMoon />}
            </button>
            <button className="btn-login" onClick={openLogin} style={{ 
              borderColor: themeColors.accent, 
              color: themeColors.accent,
              background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
            }}>
              <FaSignInAlt /> Login
            </button>
            <button className="btn-register" onClick={openRegister} style={{ 
              background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`
            }}>
              <FaUserPlus /> Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Animated Background Particles */}
      <div className="particles-bg">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${(particle.y + scrollY * 0.05) % 100}%`,
              width: particle.size,
              height: particle.size,
              animationDuration: `${particle.speed}s`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              background: themeColors.accent
            }}
          />
        ))}
      </div>

      {/* ==================== HERO SECTION ==================== */}
      <section id="hero" className="hero-section" style={{ minHeight: "100vh", paddingTop: "80px" }}>
        <div className="hero-content">
          <div className="hero-badge" style={{ background: themeColors.accentGlow, color: themeColors.accent }}>
            <FaBrain /> AI-Powered Code Analysis
          </div>
          
          <h1 className="typing-title" style={{ color: themeColors.textPrimary }}>
            {typedText}
            <span className="cursor" style={{ color: themeColors.accent }}>|</span>
          </h1>
          
          <p className="hero-subtitle" style={{ color: themeColors.textSecondary }}>
            Instantly detect bugs, security vulnerabilities, and performance issues
            in JavaScript, Python, Java, C++ & more
          </p>
          
          <div className="hero-buttons">
            <button 
              className="cta-primary"
              onClick={openLogin}
              style={{ 
                background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                boxShadow: `0 4px 15px ${themeColors.accentGlow}`
              }}
            >
              <FaRocket /> Start Analyzing
            </button>
            <button 
              className="cta-secondary"
              onClick={openRegister}
              style={{ borderColor: themeColors.border, color: themeColors.textPrimary }}
            >
              Create Free Account
            </button>
          </div>

          {/* Stats Cards */}
          <div id="stats" className="stats-grid">
            <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}` }}>
              <div className="stat-number" style={{ color: themeColors.accent }}>50K+</div>
              <div className="stat-label" style={{ color: themeColors.textSecondary }}>Codes Analyzed</div>
            </div>
            <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}` }}>
              <div className="stat-number" style={{ color: themeColors.success }}>98%</div>
              <div className="stat-label" style={{ color: themeColors.textSecondary }}>Accuracy Rate</div>
            </div>
            <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}` }}>
              <div className="stat-number" style={{ color: themeColors.warning }}>10K+</div>
              <div className="stat-label" style={{ color: themeColors.textSecondary }}>Happy Developers</div>
            </div>
            <div className="stat-card" style={{ background: themeColors.cardBg, border: `1px solid ${themeColors.border}` }}>
              <div className="stat-number" style={{ color: themeColors.info }}>24/7</div>
              <div className="stat-label" style={{ color: themeColors.textSecondary }}>AI Support</div>
            </div>
          </div>

          <div className="scroll-indicator" onClick={scrollToFeatures}>
            <span style={{ color: themeColors.textSecondary }}>Discover More</span>
            <FaArrowDown className="scroll-arrow" style={{ color: themeColors.accent }} />
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-badge" style={{ background: themeColors.accentGlow, color: themeColors.accent }}>Why Choose Us</span>
            <h2 className="section-title" style={{ color: themeColors.textPrimary }}>Powerful Features for</h2>
            <h2 className="section-title-highlight" style={{ background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.success})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Modern Development</h2>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card" 
                style={{ 
                  background: themeColors.cardBg, 
                  border: `1px solid ${themeColors.border}`,
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.borderColor = feature.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = themeColors.border;
                }}
              >
                <div className="feature-icon" style={{ color: feature.color }}>{feature.icon}</div>
                <h3 style={{ color: themeColors.textPrimary }}>{feature.title}</h3>
                <p style={{ color: themeColors.textSecondary }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section id="cta" className="cta-section">
        <div className="container">
          <div className="cta-content" style={{ 
            background: `linear-gradient(135deg, ${themeColors.accentGlow}, ${themeColors.cardBg})`,
            border: `1px solid ${themeColors.border}`,
            borderRadius: "40px"
          }}>
            <h2 style={{ color: themeColors.textPrimary }}>Ready to Supercharge Your Code?</h2>
            <p style={{ color: themeColors.textSecondary }}>Join thousands of developers who trust CodeAnalyzer AI</p>
            <div className="cta-buttons">
              <button 
                className="cta-primary large"
                onClick={openLogin}
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                  boxShadow: `0 4px 15px ${themeColors.accentGlow}`
                }}
              >
                Get Started Free
              </button>
              <button 
                className="cta-secondary large"
                onClick={openRegister}
                style={{ borderColor: themeColors.border, color: themeColors.textPrimary }}
              >
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer" style={{ 
        background: themeColors.cardBg, 
        borderTop: `1px solid ${themeColors.border}`,
        marginTop: "auto"
      }}>
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <FaCode className="logo-icon" style={{ color: themeColors.accent }} />
              <span className="logo-text" style={{ color: themeColors.textPrimary }}>CodeAnalyzer AI</span>
            </div>
            <p style={{ color: themeColors.textSecondary }}>Empowering developers with AI-driven code analysis</p>
            <div className="social-links">
              <a href="#" style={{ color: themeColors.textSecondary, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}><FaGithub /></a>
              <a href="#" style={{ color: themeColors.textSecondary, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}><FaTwitter /></a>
              <a href="#" style={{ color: themeColors.textSecondary, background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}><FaLinkedin /></a>
            </div>
          </div>
          
          <div className="footer-links">
            <div className="link-group">
              <h4 style={{ color: themeColors.textPrimary }}>Product</h4>
              <a href="#features" style={{ color: themeColors.textSecondary }}>Features</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Pricing</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Documentation</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>API</a>
            </div>
            <div className="link-group">
              <h4 style={{ color: themeColors.textPrimary }}>Company</h4>
              <a href="#" style={{ color: themeColors.textSecondary }}>About Us</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Blog</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Careers</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Contact</a>
            </div>
            <div className="link-group">
              <h4 style={{ color: themeColors.textPrimary }}>Legal</h4>
              <a href="#" style={{ color: themeColors.textSecondary }}>Privacy Policy</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Terms of Service</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Cookie Policy</a>
            </div>
            <div className="link-group">
              <h4 style={{ color: themeColors.textPrimary }}>Support</h4>
              <a href="#" style={{ color: themeColors.textSecondary }}>Help Center</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Community</a>
              <a href="#" style={{ color: themeColors.textSecondary }}>Status</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom" style={{ borderTopColor: themeColors.border }}>
          <p style={{ color: themeColors.textSecondary }}>© 2024 CodeAnalyzer AI. All rights reserved. Built with ❤️ for developers</p>
        </div>
      </footer>

      {/* ==================== ANIMATED AUTH MODAL ==================== */}
      <AnimatedAuth 
        isOpen={showAuth}
        onClose={closeAuth}
        onSwitchToRegister={() => {
          setAuthMode("register");
        }}
        onSwitchToLogin={() => {
          setAuthMode("login");
        }}
        initialMode={authMode}
      />
    </div>
  );
}

export default Landing;