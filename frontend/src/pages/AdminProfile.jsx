import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaUserCircle, FaCamera, FaGithub, 
  FaLinkedin, FaMapMarkerAlt, FaGraduationCap, 
  FaBell, FaLock, FaToggleOn, FaToggleOff,
  FaSave, FaEdit, FaTimes, FaSpinner,
  FaCheckCircle, FaExclamationTriangle
} from "react-icons/fa";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

function AdminProfile() {
  const navigate = useNavigate();
  const { themeColors, theme } = useTheme();
  
  const [profile, setProfile] = useState({
    first_name: "", last_name: "", bio: "", education: "",
    college: "", location: "", skills: "", linkedin: "",
    github: "", profile_image: null
  });

  const [settings, setSettings] = useState({
    notifications: true
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
    <div style={pageWrapper(themeColors)}>
      {/* Toast Notification */}
      {showToast && (
        <div style={toastStyle(themeColors, showToast.type)}>
          {showToast.type === "success" ? <FaCheckCircle color={themeColors.success} /> : <FaExclamationTriangle color={themeColors.danger} />}
          {showToast.message}
        </div>
      )}

      <main style={mainContent}>
        <div style={containerStyle}>
          <div style={cardStyle(themeColors)}>
            
            {/* PROFILE AVATAR & NAME */}
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div style={avatarWrapperStyle(themeColors)}>
                {imagePreview ? (
                  <img
                    src={imagePreview.startsWith("http") || imagePreview.startsWith("data:image")
                      ? imagePreview
                      : `http://localhost:5000${imagePreview}`}
                    alt="Profile"
                    style={avatarImg}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <FaUserCircle style={{ width: "100%", height: "100%", color: themeColors.textSecondary }} />
                )}
                {edit && (
                  <label style={cameraBadge(themeColors)}>
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
              <h2 style={{ color: themeColors.textPrimary, marginTop: "15px" }}>
                {profile.first_name || "Guest"} {profile.last_name}
              </h2>
            </div>

            {/* PROFILE FORM FIELDS */}
            <div style={formGrid}>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}>First Name</label>
                <input 
                  name="first_name" 
                  value={profile.first_name || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}>Last Name</label>
                <input 
                  name="last_name" 
                  value={profile.last_name || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
              <div style={{ ...inputGroup, gridColumn: "1/-1" }}>
                <label style={labelStyle(themeColors)}>Bio</label>
                <textarea 
                  name="bio" 
                  value={profile.bio || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={{ ...inputStyle(edit, themeColors), height: "80px", resize: "vertical" }} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}><FaGraduationCap /> College</label>
                <input 
                  name="college" 
                  value={profile.college || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}><FaMapMarkerAlt /> Location</label>
                <input 
                  name="location" 
                  value={profile.location || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}><FaLinkedin style={{ color: "#0077b5" }} /> LinkedIn</label>
                <input 
                  name="linkedin" 
                  value={profile.linkedin || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle(themeColors)}><FaGithub /> GitHub</label>
                <input 
                  name="github" 
                  value={profile.github || ""} 
                  onChange={handleChange} 
                  disabled={!edit} 
                  style={inputStyle(edit, themeColors)} 
                />
              </div>
            </div>

            {/* SETTINGS SECTION */}
            <div style={{ 
              marginTop: "40px", 
              paddingTop: "30px", 
              borderTop: `1px solid ${themeColors.border}` 
            }}>
              <div style={formGrid}>
                <div style={inputGroup}>
                  <label style={{...labelStyle(themeColors), fontSize: "1rem"}}>
                    <FaBell style={{ color: settings.notifications ? themeColors.success : themeColors.textSecondary }} /> 
                    Notifications
                  </label>
                  <button 
                    onClick={() => handleSettingsToggle('notifications')}
                    style={{
                      ...toggleStyle(settings.notifications, themeColors),
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
                  <label style={{...labelStyle(themeColors), fontSize: "1rem"}}>
                    <FaLock style={{ color: themeColors.danger }} /> Password Reset
                  </label>
                  <button 
                    onClick={resetPassword}
                    style={resetPasswordStyle(themeColors)}
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
                    ...btnPrimary(themeColors), 
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
                <button onClick={() => setEdit(true)} style={btnPrimary(themeColors)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button 
                    onClick={saveProfile} 
                    disabled={loading}
                    style={{ 
                      ...btnPrimary(themeColors), 
                      opacity: loading ? 0.7 : 1, 
                      cursor: loading ? "not-allowed" : "pointer" 
                    }}
                  >
                    {loading ? <FaSpinner style={{ animation: "spin 1s linear infinite" }} /> : <FaSave />}
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button 
                    onClick={() => {
                      setEdit(false);
                      setImageFile(null);
                    }} 
                    disabled={loading}
                    style={{ 
                      ...btnCancel(themeColors), 
                      opacity: loading ? 0.7 : 1, 
                      cursor: loading ? "not-allowed" : "pointer" 
                    }}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* PASSWORD RESET MODAL */}
      {showPasswordModal && (
        <div style={modalOverlay(themeColors)}>
          <div style={modalContent(themeColors)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ color: themeColors.textPrimary, margin: 0 }}>🔐 Reset Password</h3>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                style={{ background: "none", border: "none", color: themeColors.textSecondary, fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ color: themeColors.textSecondary, fontSize: "14px", marginBottom: "5px", display: "block" }}>
                  New Password
                </label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (6+ chars)"
                  style={passwordInputStyle(themeColors)}
                  autoFocus
                />
              </div>
              
              <div>
                <label style={{ color: themeColors.textSecondary, fontSize: "14px", marginBottom: "5px", display: "block" }}>
                  Confirm Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={passwordInputStyle(themeColors)}
                />
              </div>
              
              {passwordError && (
                <div style={{ 
                  color: themeColors.danger, 
                  fontSize: "13px", 
                  padding: "8px 12px", 
                  background: `${themeColors.danger}20`, 
                  borderRadius: "6px",
                  borderLeft: `3px solid ${themeColors.danger}`
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
                  style={modalCancelBtn(themeColors)}
                  disabled={savingSettings}
                >
                  Cancel
                </button>
                <button 
                  onClick={completePasswordReset}
                  disabled={savingSettings || newPassword.length === 0 || newPassword !== confirmPassword}
                  style={{
                    ...modalConfirmBtn(themeColors),
                    opacity: savingSettings ? 0.7 : 1,
                    cursor: savingSettings ? "not-allowed" : (newPassword.length === 0 || newPassword !== confirmPassword ? "not-allowed" : "pointer")
                  }}
                >
                  {savingSettings ? "🔄 Resetting..." : "Reset Password"}
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
      `}</style>
    </div>
  );
}

// Styles functions
const pageWrapper = (themeColors) => ({ 
  display: "flex", 
  flexDirection: "column", 
  minHeight: "100vh",
  paddingTop: "60px", 
  backgroundColor: themeColors.background, 
  color: themeColors.textPrimary, 
  fontFamily: "system-ui" 
});

const toastStyle = (themeColors, type) => ({
  position: "fixed",
  bottom: "24px",
  right: "24px",
  padding: "12px 20px",
  background: themeColors.cardBg,
  border: `1px solid ${type === "success" ? themeColors.success : themeColors.danger}`,
  borderRadius: "12px",
  color: themeColors.textPrimary,
  fontSize: "14px",
  zIndex: 10000,
  animation: "slideIn 0.3s ease",
  display: "flex",
  alignItems: "center",
  gap: "8px"
});

const mainContent = { flex: 1, padding: "40px 0", overflowY: "auto" };
const containerStyle = { maxWidth: "700px", margin: "0 auto" };
const cardStyle = (themeColors) => ({ 
  background: themeColors.cardBg, 
  padding: "30px", 
  borderRadius: "20px", 
  border: `1px solid ${themeColors.border}`,
  backdropFilter: "blur(10px)"
});

const avatarWrapperStyle = (themeColors) => ({ 
  width: "100px", 
  height: "100px", 
  borderRadius: "50%", 
  margin: "0 auto", 
  position: "relative", 
  border: `2px solid ${themeColors.accent}`, 
  padding: "3px" 
});

const avatarImg = { width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" };

const cameraBadge = (themeColors) => ({ 
  position: "absolute", 
  bottom: 0, 
  right: 0, 
  background: themeColors.accent, 
  color: "#fff", 
  width: "26px", 
  height: "26px", 
  borderRadius: "50%", 
  display: "flex", 
  alignItems: "center", 
  justifyContent: "center", 
  cursor: "pointer", 
  border: `2px solid ${themeColors.cardBg}` 
});

const formGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "5px" };

const labelStyle = (themeColors) => ({ 
  fontSize: "0.75rem", 
  color: themeColors.textSecondary, 
  fontWeight: "600", 
  display: "flex", 
  alignItems: "center", 
  gap: "6px" 
});

const inputStyle = (edit, themeColors) => ({ 
  padding: "10px", 
  borderRadius: "8px", 
  background: edit ? themeColors.background : themeColors.bgInner, 
  border: edit ? `1px solid ${themeColors.accent}` : `1px solid ${themeColors.border}`, 
  color: themeColors.textPrimary, 
  outline: "none", 
  fontSize: "14px",
  transition: "all 0.3s ease"
});

const toggleStyle = (active, themeColors) => ({
  background: active ? themeColors.accent : themeColors.bgInner,
  color: themeColors.textPrimary,
  border: active ? `1px solid ${themeColors.accent}` : `1px solid ${themeColors.border}`,
  borderRadius: "8px",
  transition: "all 0.3s ease",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  cursor: "pointer"
});

const resetPasswordStyle = (themeColors) => ({
  padding: "12px 24px",
  background: `linear-gradient(135deg, ${themeColors.danger}, #dc2626)`,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  transition: "all 0.3s ease",
  boxShadow: `0 2px 8px ${themeColors.danger}40`,
  width: "100%"
});

const btnPrimary = (themeColors) => ({ 
  padding: "10px 24px", 
  background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
  color: "#fff", 
  border: "none", 
  borderRadius: "8px", 
  fontWeight: "600", 
  cursor: "pointer", 
  fontSize: "14px",
  transition: "all 0.3s ease"
});

const btnCancel = (themeColors) => ({ 
  padding: "10px 24px", 
  background: "transparent", 
  color: themeColors.danger, 
  border: `1px solid ${themeColors.danger}`, 
  borderRadius: "8px", 
  cursor: "pointer", 
  fontSize: "14px",
  transition: "all 0.3s ease"
});

const modalOverlay = (themeColors) => ({
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: `${themeColors.background}E6`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  backdropFilter: "blur(4px)"
});

const modalContent = (themeColors) => ({
  background: themeColors.cardBg,
  padding: "30px",
  borderRadius: "20px",
  border: `1px solid ${themeColors.border}`,
  minWidth: "400px",
  maxWidth: "90vw",
  boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
});

const passwordInputStyle = (themeColors) => ({
  width: "100%",
  padding: "12px 16px",
  background: themeColors.background,
  border: `1px solid ${themeColors.border}`,
  borderRadius: "8px",
  color: themeColors.textPrimary,
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s"
});

const modalCancelBtn = (themeColors) => ({
  padding: "10px 20px",
  background: "transparent",
  color: themeColors.textSecondary,
  border: `1px solid ${themeColors.border}`,
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px"
});

const modalConfirmBtn = (themeColors) => ({
  padding: "10px 20px",
  background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600"
});

export default AdminProfile;