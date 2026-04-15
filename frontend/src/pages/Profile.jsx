import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUserCircle, FaSignOutAlt, FaCamera, FaGithub, 
  FaLinkedin, FaMapMarkerAlt, FaGraduationCap, 
  FaHeart, FaBell, FaBellSlash, FaLock, FaToggleOn, FaToggleOff
} from "react-icons/fa";
import API from "../services/api";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: "", last_name: "", bio: "", education: "",
    college: "", location: "", skills: "", linkedin: "",
    github: "", profile_image: null
  });

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    email_notifications: true
  });

  const [edit, setEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // 🔥 PASSWORD MODAL STATES
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const res = await API.get("/user/profile");

      const safeProfile = {
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        bio: res.data.bio || "",
        education: res.data.education || "",
        college: res.data.college || "",
        location: res.data.location || "",
        skills: res.data.skills || "",
        linkedin: res.data.linkedin || "",
        github: res.data.github || "",
        profile_image: res.data.profile_image || null
      };

      setProfile(safeProfile);

              if (safeProfile.profile_image) {
          const src = safeProfile.profile_image;

          const fullImageUrl =
            src.startsWith("http") || src.startsWith("data:image")
              ? src
              : `http://localhost:5000${src}`;

          setImagePreview(fullImageUrl);
        }

      setSettings({
        notifications: res.data.notifications !== false
      });
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || "Unknown error";
      console.error("Profile fetch failed:", err);
      alert("Profile error: " + errMsg);
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSettingsToggle = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await API.patch("/user/settings", settings);
      alert("✅ Settings updated!");
    } catch (err) {
      console.error("Settings save error:", err);
      alert("❌ Settings update failed");
    } finally {
      setSavingSettings(false);
    }
  };

  // 🔥 PASSWORD RESET FUNCTIONS
  const resetPassword = async () => {
    try {
      setSavingSettings(true);
      await API.post("/user/password/reset");
      setShowPasswordModal(true);
    } catch (err) {
      alert("❌ Reset failed: " + (err.response?.data?.error || "Try again"));
    } finally {
      setSavingSettings(false);
    }
  };

  const completePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match!");
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError("Password must be 6+ characters");
      return;
    }

    try {
      setSavingSettings(true);
      setPasswordError('');
      
      await API.post("/user/password/complete-reset", {
        newPassword
      });
      
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      alert("✅ Password reset successfully!");
      
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Reset failed");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      Object.keys(profile).forEach(key => {
        formData.append(key, profile[key] || "");
      });
      
      if (imageFile) {
        formData.append('profile_image', imageFile);
      }

      await API.put("/user/profile", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      alert("✅ Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("Profile save error:", err.response?.data || err);
      alert("❌ Update failed: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", justifyContent: "center", alignItems: "center", 
        height: "100vh", backgroundColor: "#0d1117" 
      }}>
        <div style={{ color: "#58a6ff", fontSize: "18px" }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      {/* HEADER */}
      <header style={headerStyle}>
        <div style={contentWidth}>
          <div style={headerFlex}>
            <h1 style={logoStyle}>AI Code Analyzer</h1>
            <nav style={navGap}>
              <button className="nav-link" onClick={() => navigate("/dashboard")}>Home</button>
              <button className="nav-link" onClick={() => navigate("/analyzer")}>Analyze</button>
              <button className="nav-link" onClick={() => navigate("/code-runner")}>Runner</button>
              <button className="icon-btn blue" onClick={() => navigate("/profile")}><FaUserCircle size={24} /></button>
              <button className="icon-btn red" onClick={() => navigate("/")}>
                <FaSignOutAlt size={20} />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main style={mainContent}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            
            {/* PROFILE AVATAR & NAME */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={avatarWrapperStyle}>
                {imagePreview ? (
                  <img
                    src={
                      // If already a full URL or Data URL, use as-is
                      imagePreview.startsWith("http") || imagePreview.startsWith("data:image")
                        ? imagePreview
                        // If it's a relative path, prefix with server base
                        : `http://localhost:5000${imagePreview}`
                    }
                    alt="Profile"
                    style={avatarImg}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      console.error("❌ Image failed:", imagePreview);
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                  ) : (
                    <FaUserCircle style={{ width: "100%", height: "100%", color: "#30363d" }} />
                  )}
                {edit && (
                  <label style={cameraBadge}>
                    <FaCamera size={12} />
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange} 
                      style={{ display: "none" }} 
                    />
                  </label>
                )}
              </div>
              <h2 style={{ color: "#fff", marginTop: "15px" }}>
                {profile.first_name || "Guest"} {profile.last_name}
              </h2>
            </div>

            {/* PROFILE FORM FIELDS */}
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={labelStyle}>First Name</label>
                <input 
                  name="first_name" 
                  value={profile.first_name || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Last Name</label>
                <input 
                  name="last_name" 
                  value={profile.last_name || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
              <div style={{ ...inputGroup, gridColumn: "1/-1" }}>
                <label style={labelStyle}>Bio</label>
                <textarea 
                  name="bio" 
                  value={profile.bio || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={{ ...inputStyle(edit), height: "80px", resize: "vertical" }} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}><FaGraduationCap /> College</label>
                <input 
                  name="college" 
                  value={profile.college || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}><FaMapMarkerAlt /> Location</label>
                <input 
                  name="location" 
                  value={profile.location || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}><FaLinkedin style={{ color: "#0077b5" }} /> LinkedIn</label>
                <input 
                  name="linkedin" 
                  value={profile.linkedin || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}><FaGithub style={{ color: "#fff" }} /> GitHub</label>
                <input 
                  name="github" 
                  value={profile.github || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit)} 
                />
              </div>
            </div>

            {/* SETTINGS SECTION */}
            <div style={{ 
              marginTop: "40px", 
              paddingTop: "30px", 
              borderTop: "1px solid #30363d" 
            }}>
              <h3 style={{ 
                color: "#58a6ff", 
                marginBottom: "25px", 
                fontSize: "1.3rem",
                display: "flex", 
                alignItems: "center", 
                gap: "10px"
              }}>
                <FaBell /> Settings
              </h3>

              <div style={formGrid}>
                <div style={inputGroup}>
                  <label style={{...labelStyle, fontSize: "0.9rem"}}>
                    <FaBell style={{ color: settings.notifications ? "#3fb950" : "#8b949e" }} /> 
                    Notifications
                  </label>
                  <button 
                    onClick={() => handleSettingsToggle('notifications')}
                    style={{
                      ...toggleStyle(settings.notifications),
                      padding: "12px 20px",
                      width: "100%",
                      justifyContent: "space-between"
                    }}
                    disabled={savingSettings}
                  >
                    <span>Enable all notifications</span>
                    {settings.notifications ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                  </button>
                </div>

               

                {/* PASSWORD RESET BUTTON */}
                <div style={{ ...inputGroup, gridColumn: "1 / -1", marginTop: "20px" }}>
                  <label style={labelStyle}>
                    <FaLock style={{ color: "#f85149" }} /> Password Reset
                  </label>
                  <button 
                    onClick={resetPassword}
                    style={resetPasswordStyle}
                    disabled={savingSettings}
                  >
                    🔐 Reset Password
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "25px", textAlign: "center" }}>
                <button 
                  onClick={saveSettings}
                  disabled={savingSettings}
                  style={{ 
                    ...btnPrimary, 
                    opacity: savingSettings ? 0.7 : 1, 
                    cursor: savingSettings ? "not-allowed" : "pointer" 
                  }}
                >
                  {savingSettings ? "💾 Saving..." : "✅ Save Settings"}
                </button>
              </div>
            </div>

            {/* PROFILE ACTION BUTTONS */}
            <div style={{ marginTop: "30px", textAlign: "center" }}>
              {!edit ? (
                <button onClick={() => setEdit(true)} style={btnPrimary}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button 
                    onClick={saveProfile} 
                    disabled={loading}
                    style={{ 
                      ...btnPrimary, 
                      opacity: loading ? 0.7 : 1, 
                      cursor: loading ? "not-allowed" : "pointer" 
                    }}
                  >
                    {loading ? "💾 Saving..." : "✅ Save Changes"}
                  </button>
                  <button 
                    onClick={() => {
                      setEdit(false);
                      setImageFile(null);
                    }} 
                    disabled={loading}
                    style={{ 
                      ...btnCancel, 
                      opacity: loading ? 0.7 : 1, 
                      cursor: loading ? "not-allowed" : "pointer" 
                    }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={footerStyle}>
        <div style={contentWidth}>
          <div style={footerGrid}>
            <div>
              <h4 style={{ color: "#fff", marginBottom: "10px" }}>AI Code Analyzer</h4>
              <p style={{ fontSize: "0.85rem", lineHeight: "1.6" }}>
                Empowering developers with AI-driven insights and real-time code analysis.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem" }}>
                Made with <FaHeart style={{ color: "#ff4d4d", margin: "0 4px" }} /> for Devs
              </p>
              <div style={{ marginTop: "10px", display: "flex", justifyContent: "center", gap: "15px" }}>
                <span style={footerLink}>Privacy</span>
                <span style={footerLink}>Terms</span>
                <span style={footerLink}>Docs</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={statusIndicator}>
                <div style={statusDot}></div>
                System Operational
              </div>
              <p style={{ fontSize: "0.75rem", marginTop: "10px", color: "#8b949e" }}>
                © 2026 AI Code Analyzer Inc.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* 🔥 PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: "#fff", margin: 0 }}>🔐 Reset Password</h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                style={{ background: "none", border: "none", color: "#8b949e", fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ color: "#8b949e", fontSize: "14px", marginBottom: "5px", display: "block" }}>
                  New Password
                </label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (6+ chars)"
                  style={passwordInputStyle}
                  autoFocus
                />
              </div>
              
              <div>
                <label style={{ color: "#8b949e", fontSize: "14px", marginBottom: "5px", display: "block" }}>
                  Confirm Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={passwordInputStyle}
                />
              </div>
              
              {passwordError && (
                <div style={{ 
                  color: "#f85149", 
                  fontSize: "13px", 
                  padding: "8px 12px", 
                  background: "rgba(248,81,73,0.1)", 
                  borderRadius: "6px",
                  borderLeft: "3px solid #f85149"
                }}>
                  {passwordError}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  style={modalCancelBtn}
                  disabled={savingSettings}
                >
                  Cancel
                </button>
                <button 
                  onClick={completePasswordReset}
                  disabled={savingSettings || newPassword.length === 0 || newPassword !== confirmPassword}
                  style={{
                    ...modalConfirmBtn,
                    opacity: savingSettings ? 0.7 : 1,
                    cursor: savingSettings ? "not-allowed" : (newPassword.length === 0 || newPassword !== confirmPassword ? "not-allowed" : "pointer")
                  }}
                >
                  {savingSettings ? "🔄 Resetting..." : "✅ Reset Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS + STYLES */}
      <style>{`
        .nav-link { 
          background: none; border: none; color: #8b949e; cursor: pointer; 
          font-weight: 500; padding: 8px 16px; border-radius: 6px; 
          transition: all 0.2s;
        }
        .nav-link:hover { 
          color: #3d9af2; background: rgba(61, 154, 242, 0.1);
        }
        .icon-btn { 
          background: none; border: none; cursor: pointer; 
          transition: transform 0.2s; padding: 8px; border-radius: 6px;
        }
        .icon-btn.blue { color: #3d9af2; }
        .icon-btn.red { color: #f85149; }
        .icon-btn:hover { transform: translateY(-2px); }
      `}</style>
    </div>
  );
}

// 🔥 ALL STYLES
const pageWrapper = { 
  display: "flex", flexDirection: "column", minHeight: "100vh", 
  backgroundColor: "#0d1117", color: "#c9d1d9", fontFamily: "system-ui" 
};

const headerStyle = { background: "#161b22", borderBottom: "1px solid #30363d", padding: "15px 0" };
const contentWidth = { maxWidth: "1100px", margin: "0 auto", padding: "0 20px" };
const headerFlex = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const logoStyle = { fontSize: "1.2rem", fontWeight: "bold", color: "#58a6ff", margin: 0 };
const navGap = { display: "flex", gap: "20px", alignItems: "center" };

const mainContent = { flex: 1, padding: "40px 0" };
const containerStyle = { maxWidth: "700px", margin: "0 auto" };
const cardStyle = { background: "#161b22", padding: "30px", borderRadius: "12px", border: "1px solid #30363d" };

const avatarWrapperStyle = { 
  width: "100px", height: "100px", borderRadius: "50%", margin: "0 auto", 
  position: "relative", border: "2px solid #58a6ff", padding: "3px" 
};
const avatarImg = { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" };
const cameraBadge = { 
  position: "absolute", bottom: 0, right: 0, background: "#238636", color: "#fff", 
  width: "26px", height: "26px", borderRadius: "50%", display: "flex", 
  alignItems: "center", justifyContent: "center", cursor: "pointer", 
  border: "2px solid #161b22" 
};

const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "5px" };
const labelStyle = { 
  fontSize: "0.75rem", color: "#8b949e", fontWeight: "600", 
  display: "flex", alignItems: "center", gap: "6px" 
};
const inputStyle = (edit) => ({ 
  padding: "10px", borderRadius: "6px", background: edit ? "#0d1117" : "#21262d", 
  border: edit ? "1px solid #58a6ff" : "1px solid #30363d", color: "#fff", 
  outline: "none", fontSize: "14px"
});

const toggleStyle = (active) => ({
  background: active ? "#238636" : "#30363d",
  color: "#fff",
  border: active ? "1px solid #2ea043" : "1px solid #30363d",
  borderRadius: "6px",
  transition: "all 0.2s",
  fontSize: "14px",
  display: "flex",
  alignItems: "center"
});

const resetPasswordStyle = {
  padding: "12px 24px",
  background: "linear-gradient(135deg, #f85149, #da3633)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.2s",
  boxShadow: "0 2px 8px rgba(248, 81, 73, 0.3)",
  width: "100%"
};

const btnPrimary = { 
  padding: "10px 24px", background: "#238636", color: "#fff", border: "none", 
  borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "14px" 
};
const btnCancel = { 
  padding: "10px 24px", background: "transparent", color: "#f85149", 
  border: "1px solid #f85149", borderRadius: "6px", cursor: "pointer", fontSize: "14px" 
};

// 🔥 MODAL STYLES
const modalOverlay = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(13,17,23,0.9)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backdropFilter: "blur(4px)"
};

const modalContent = {
  background: "#161b22",
  padding: "30px",
  borderRadius: "12px",
  border: "1px solid #30363d",
  minWidth: "400px",
  maxWidth: "90vw",
  boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
};

const passwordInputStyle = {
  width: "100%",
  padding: "12px 16px",
  background: "#0d1117",
  border: "1px solid #30363d",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s"
};

const modalCancelBtn = {
  padding: "10px 20px",
  background: "transparent",
  color: "#8b949e",
  border: "1px solid #30363d",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px"
};

const modalConfirmBtn = {
  padding: "10px 20px",
  background: "#238636",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
};

const footerStyle = { 
  background: "#161b22", borderTop: "1px solid #30363d", padding: "40px 0", 
  marginTop: "auto", color: "#8b949e" 
};
const footerGrid = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", gap: "20px" };
const footerLink = { 
  fontSize: "0.8rem", cursor: "pointer", padding: "4px 8px", borderRadius: "4px" 
};
const statusIndicator = { 
  display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", 
  color: "#3fb950", fontSize: "0.85rem", fontWeight: "500" 
};
const statusDot = { 
  width: "8px", height: "8px", borderRadius: "50%", background: "#3fb950", 
  boxShadow: "0 0 8px #3fb950" 
};

export default Profile;