import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Login";      // ← ADD THESE IMPORTS
import Register from "./Register";
import "./Landing.css";

function Landing() {
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [scrollY, setScrollY] = useState(0);
  
  // 🔥 NEW MODAL STATES
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Dynamic typing effect
  const [typedText, setTypedText] = useState("");
  const fullText = "AI Code Quality & Bug Detector";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Typing effect
    const timer = setTimeout(() => {
      if (!isDeleting && currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      } else if (isDeleting && currentIndex > 0) {
        setTypedText(fullText.slice(0, currentIndex - 1));
        setCurrentIndex(currentIndex - 1);
      } else {
        setIsDeleting(!isDeleting);
        setCurrentIndex(isDeleting ? fullText.length : 0);
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting]);

  // Parallax scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animated particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100 - 100,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.5 + 0.3
    }));
    setParticles(newParticles);
  }, []);

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-container">
      {/* Animated Background Particles */}
      <div className="particles-bg">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y + scrollY * 0.1}%`,
              width: particle.size,
              height: particle.size,
              animationDuration: `${particle.speed}s`,
              opacity: particle.opacity
            }}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="typing-title">
              {typedText}
              <span className="cursor">|</span>
            </h1>
            <p className="hero-subtitle">
              Instantly detect bugs, security vulnerabilities, and performance issues 
              in JavaScript, Python, Java, C++ & more
            </p>
            
            {/* 🔥 FIXED: MODAL BUTTONS INSTEAD OF NAVIGATION */}
            <div className="hero-buttons">
              <button 
                className="cta-primary"
                onClick={() => setShowLogin(true)}  // ← CHANGED: Opens modal
              >
                🚀 Start Analyzing
              </button>
              <button 
                className="cta-secondary"
                onClick={() => setShowRegister(true)}  // ← CHANGED: Opens modal
              >
                Create Free Account
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Codes Analyzed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">95%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">What Makes Us Different</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Security First</h3>
              <p>Detects SQL injection, XSS, eval() risks, and 50+ vulnerabilities</p>
            </div>
            
            
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Code Quality Score</h3>
              <p>Get actionable metrics: complexity, functions, lines, and fix suggestions</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3>History & Dashboard</h3>
              <p>Track improvements over time with detailed analytics</p>
            </div>
          </div>

          <div className="scroll-down" onClick={scrollToFeatures}>
            <span>↓ Discover More</span>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Supercharge Your Code?</h2>
          <div className="cta-buttons">
            <button 
              className="cta-primary large"
              onClick={() => setShowLogin(true)}  // ← FIXED: Modal
            >
              Get Started Free
            </button>
            <button 
              className="cta-secondary large"
              onClick={() => setShowRegister(true)}  // ← FIXED: Modal
            >
              Sign Up Now
            </button>
          </div>
        </div>
      </section>

      {/* 🔥 ADD MODALS HERE */}
      <Login 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false);
          setShowRegister(true);
        }}
      />
      <Register 
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false);
          setShowLogin(true);
        }}
      />
    </div>
  );
}

export default Landing;
