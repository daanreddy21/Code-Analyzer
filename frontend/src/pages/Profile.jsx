import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUserCircle, FaSignOutAlt, FaCamera, FaGithub, 
  FaLinkedin, FaMapMarkerAlt, FaGraduationCap, 
  FaHeart, FaBell, FaBellSlash, FaLock, FaToggleOn, FaToggleOff,
  FaEnvelope, FaPhone, FaGlobe, FaSave, FaEdit, FaTimes,
  FaCheckCircle, FaExclamationTriangle, FaSpinner
} from "react-icons/fa";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    first_name: "", last_name: "", bio: "", education: "",
    college: "", location: "", skills: "", linkedin: "",
    github: "", profile_image: null
  });

  const [settings, setSettings] = useState({
    notifications: true,
    email_notifications: true
  });

  const [edit, setEdit] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showToast, setShowToast] = useState(null);

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const showToastMessage = (message, type = "success") => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

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
          const fullImageUrl = src.startsWith("http") || src.startsWith("data:image")
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
        showToastMessage("Profile error: " + errMsg, "error");
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
      showToastMessage("Settings updated successfully!", "success");
    } catch (err) {
      console.error("Settings save error:", err);
      showToastMessage("Settings update failed", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const resetPassword = async () => {
    try {
      setSavingSettings(true);
      await API.post("/user/password/reset");
      setShowPasswordModal(true);
    } catch (err) {
      showToastMessage("Reset failed: " + (err.response?.data?.error || "Try again"), "error");
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
      showToastMessage("Password reset successfully!", "success");
      
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Reset failed");
      showToastMessage("Password reset failed", "error");
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
      
      showToastMessage("Profile updated successfully!", "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Profile save error:", err.response?.data || err);
      showToastMessage("Update failed: " + (err.response?.data?.error || err.message), "error");
    } finally {
      setLoading(false);
    }
  };

  // Animation styles
  const animationStyles = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes modalScaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .profile-input:focus {
      outline: none;
      border-color: ${themeColors.accent};
      box-shadow: 0 0 0 2px ${themeColors.accentGlow};
    }
    .setting-card:hover {
      transform: translateY(-2px);
      border-color: ${themeColors.accent};
    }
  `;

  if (loading && !profile.first_name) {
    return (
      <div style={{ 
        display: "flex", justifyContent: "center", alignItems: "center", 
        height: "100vh", background: themeColors.background 
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ 
            width: "48px", 
            height: "48px", 
            border: `4px solid ${themeColors.border}`, 
            borderTop: `4px solid ${themeColors.accent}`, 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            marginBottom: "16px"
          }}></div>
          <div style={{ color: themeColors.textSecondary }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: themeColors.background, 
      color: themeColors.textPrimary,
      paddingTop: "80px",
      paddingBottom: "60px"
    }}>
      <style>{animationStyles}</style>
      
      {/* Toast Notification */}
      {showToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          padding: "12px 20px",
          background: themeColors.cardBg,
          border: `1px solid ${showToast.type === "success" ? themeColors.success : themeColors.danger}`,
          borderRadius: "12px",
          color: themeColors.textPrimary,
          fontSize: "14px",
          zIndex: 10000,
          animation: "slideIn 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          {showToast.type === "success" ? <FaCheckCircle color={themeColors.success} /> : <FaExclamationTriangle color={themeColors.danger} />}
          {showToast.message}
        </div>
      )}

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
        
        {/* Header Section */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ 
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
            padding: "8px 20px",
            borderRadius: "40px",
            marginBottom: "20px"
          }}>
            <FaUserCircle size={20} color="#fff" />
            <span style={{ color: "#fff", fontWeight: "600", fontSize: "14px" }}>User Profile</span>
          </div>
          <h1 style={{ 
            fontSize: "2.5rem", 
            fontWeight: "700", 
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #fff 0%, #5a67d8 100%)'
              : 'linear-gradient(135deg, #1a1a2e 0%, #5a67d8 100%)',
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "8px"
          }}>
            Your Profile
          </h1>
          <p style={{ color: themeColors.textSecondary, fontSize: "1rem" }}>
            Manage your personal information and account settings
          </p>
        </div>

        {/* Profile Card */}
        <div style={{ 
          background: themeColors.cardBg, 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: "24px", 
          padding: "32px",
          marginBottom: "32px"
        }}>
          
          {/* Avatar Section */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              margin: "0 auto", 
              position: "relative",
              border: `3px solid ${themeColors.accent}`,
              padding: "3px",
              background: themeColors.cardBg
            }}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <FaUserCircle style={{ width: "100%", height: "100%", color: themeColors.textSecondary }} />
              )}
              {edit && (
                <label style={{ 
                  position: "absolute", 
                  bottom: 0, 
                  right: 0, 
                  background: themeColors.accent, 
                  color: "#fff", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: "pointer", 
                  border: `2px solid ${themeColors.cardBg}`,
                  transition: "transform 0.2s"
                }}>
                  <FaCamera size={14} />
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              )}
            </div>
            <h2 style={{ color: themeColors.textPrimary, marginTop: "16px", fontSize: "1.5rem" }}>
              {profile.first_name || "Guest"} {profile.last_name}
            </h2>
          </div>

          {/* Form Fields */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                First Name
              </label>
              <input 
                name="first_name" 
                value={profile.first_name || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px",
                  transition: "all 0.2s"
                }} 
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600" }}>Last Name</label>
              <input 
                name="last_name" 
                value={profile.last_name || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px"
                }} 
              />
            </div>

            <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600" }}>Bio</label>
              <textarea 
                name="bio" 
                value={profile.bio || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                rows="3"
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaGraduationCap size={12} /> College
              </label>
              <input 
                name="college" 
                value={profile.college || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px"
                }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaMapMarkerAlt size={12} /> Location
              </label>
              <input 
                name="location" 
                value={profile.location || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px"
                }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaLinkedin size={12} style={{ color: "#0077b5" }} /> LinkedIn
              </label>
              <input 
                name="linkedin" 
                value={profile.linkedin || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px"
                }} 
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.75rem", color: themeColors.textSecondary, fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
                <FaGithub size={12} /> GitHub
              </label>
              <input 
                name="github" 
                value={profile.github || ""} 
                onChange={handleChange} 
                disabled={!edit} 
                className="profile-input"
                style={{ 
                  padding: "12px", 
                  borderRadius: "10px", 
                  background: edit ? themeColors.background : themeColors.bgInner,
                  border: `1px solid ${edit ? themeColors.accent : themeColors.border}`,
                  color: themeColors.textPrimary, 
                  outline: "none", 
                  fontSize: "14px"
                }} 
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "32px", textAlign: "center" }}>
            {!edit ? (
              <button onClick={() => setEdit(true)} style={{
                padding: "12px 28px",
                background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "transform 0.2s"
              }}>
                <FaEdit size={14} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <button 
                  onClick={saveProfile} 
                  disabled={loading}
                  style={{ 
                    padding: "12px 28px",
                    background: `linear-gradient(135deg, ${themeColors.success}, #16a34a)`,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {loading ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> : <FaSave size={14} />}
                  {loading ? "Saving..." : "Save Changes"}
                </button>
                <button 
                  onClick={() => {
                    setEdit(false);
                    setImageFile(null);
                  }} 
                  disabled={loading}
                  style={{ 
                    padding: "12px 28px",
                    background: "transparent",
                    color: themeColors.danger,
                    border: `1px solid ${themeColors.danger}`,
                    borderRadius: "12px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.7 : 1,
                    fontSize: "14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <FaTimes size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div style={{ 
          background: themeColors.cardBg, 
          border: `1px solid ${themeColors.border}`, 
          borderRadius: "24px", 
          padding: "32px"
        }}>
          <h3 style={{ 
            color: themeColors.accent, 
            marginBottom: "24px", 
            fontSize: "1.3rem",
            display: "flex", 
            alignItems: "center", 
            gap: "10px"
          }}>
            <FaBell /> Account Settings
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
            {/* Notification Setting */}
            <div className="setting-card" style={{ 
              padding: "16px", 
              background: themeColors.bgInner, 
              borderRadius: "16px",
              border: `1px solid ${themeColors.border}`,
              transition: "all 0.2s"
            }}>
              <label style={{ fontSize: "0.85rem", color: themeColors.textSecondary, marginBottom: "8px", display: "block" }}>
                <FaBell style={{ color: settings.notifications ? themeColors.success : themeColors.textSecondary, marginRight: "6px" }} /> 
                Notifications
              </label>
              <button 
                onClick={() => handleSettingsToggle('notifications')}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: settings.notifications ? themeColors.success : themeColors.border,
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  transition: "all 0.2s"
                }}
                disabled={savingSettings}
              >
                <span>Enable all notifications</span>
                {settings.notifications ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
              </button>
            </div>

            {/* Password Reset */}
            <div className="setting-card" style={{ 
              padding: "16px", 
              background: themeColors.bgInner, 
              borderRadius: "16px",
              border: `1px solid ${themeColors.border}`,
              transition: "all 0.2s"
            }}>
              <label style={{ fontSize: "0.85rem", color: themeColors.textSecondary, marginBottom: "8px", display: "block" }}>
                <FaLock style={{ color: themeColors.danger, marginRight: "6px" }} /> Password Reset
              </label>
              <button 
                onClick={resetPassword}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: `linear-gradient(135deg, ${themeColors.danger}, #da3633)`,
                  border: "none",
                  borderRadius: "10px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
                disabled={savingSettings}
              >
                <FaLock size={14} /> Reset Password
              </button>
            </div>
          </div>

          {/* Save Settings Button */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button 
              onClick={saveSettings}
              disabled={savingSettings}
              style={{ 
                padding: "10px 24px",
                background: `linear-gradient(135deg, ${themeColors.info}, #3182ce)`,
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "600",
                cursor: savingSettings ? "not-allowed" : "pointer",
                opacity: savingSettings ? 0.7 : 1,
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              {savingSettings ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> : <FaSave size={14} />}
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </main>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 10, 26, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            background: themeColors.cardBg,
            padding: "32px",
            borderRadius: "24px",
            border: `1px solid ${themeColors.border}`,
            minWidth: "400px",
            maxWidth: "90vw",
            animation: "modalScaleIn 0.3s ease"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ color: themeColors.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <FaLock color={themeColors.accent} /> Reset Password
              </h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                style={{ 
                  background: "none", 
                  border: "none", 
                  color: themeColors.textSecondary, 
                  fontSize: "24px", 
                  cursor: "pointer",
                  transition: "color 0.2s"
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ color: themeColors.textSecondary, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  New Password
                </label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (6+ chars)"
                  className="profile-input"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: themeColors.background,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "10px",
                    color: themeColors.textPrimary,
                    fontSize: "14px",
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>
              
              <div>
                <label style={{ color: themeColors.textSecondary, fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  Confirm Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="profile-input"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: themeColors.background,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "10px",
                    color: themeColors.textPrimary,
                    fontSize: "14px",
                    outline: "none"
                  }}
                />
              </div>
              
              {passwordError && (
                <div style={{ 
                  color: themeColors.danger, 
                  fontSize: "13px", 
                  padding: "10px 14px", 
                  background: "rgba(245, 101, 101, 0.1)", 
                  borderRadius: "8px",
                  borderLeft: `3px solid ${themeColors.danger}`
                }}>
                  {passwordError}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "8px" }}>
                <button 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  style={{
                    padding: "10px 20px",
                    background: "transparent",
                    color: themeColors.textSecondary,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                  disabled={savingSettings}
                >
                  Cancel
                </button>
                <button 
                  onClick={completePasswordReset}
                  disabled={savingSettings || newPassword.length === 0 || newPassword !== confirmPassword}
                  style={{
                    padding: "10px 20px",
                    background: `linear-gradient(135deg, ${themeColors.success}, #16a34a)`,
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    cursor: (savingSettings || newPassword.length === 0 || newPassword !== confirmPassword) ? "not-allowed" : "pointer",
                    opacity: (savingSettings || newPassword.length === 0 || newPassword !== confirmPassword) ? 0.6 : 1,
                    fontSize: "13px",
                    fontWeight: "600"
                  }}
                >
                  {savingSettings ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .profile-input:focus {
          outline: none;
          border-color: ${themeColors.accent} !important;
          box-shadow: 0 0 0 2px ${themeColors.accentGlow};
        }
        .setting-card:hover {
          transform: translateY(-2px);
          border-color: ${themeColors.accent} !important;
        }
      `}</style>
    </div>
  );
}

export default Profile;