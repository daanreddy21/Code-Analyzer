import { useState } from "react";
import API from "../services/api";
import { 
  FaTimes, 
  FaUpload, 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaProjectDiagram,
  FaDatabase,
  FaCode,
  FaFileAlt,
  FaInfoCircle
} from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";

const ProjectSubmissionModal = ({ isOpen, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    domain: "Full Stack",
    database_type: "",
    tech_stack: "",
    description: "",
    course_name: "",
    file: null
  });

  // ✅ USE THEME FROM CONTEXT
  const { themeColors, theme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("domain", formData.domain);
    formDataToSend.append("database_type", formData.database_type);
    formDataToSend.append("tech_stack", formData.tech_stack);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("course_name", formData.course_name);
    formDataToSend.append("projectFile", formData.file);

    try {
      await API.post("/projects/submit", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setSubmitSuccess(true);

      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
        resetForm();
        setSubmitSuccess(false);
      }, 1500);

    } catch (err) {
      setSubmitError(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      domain: "Full Stack",
      database_type: "",
      tech_stack: "",
      description: "",
      course_name: "",
      file: null
    });
  };

  if (!isOpen) return null;

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: themeColors.inputBg,
    border: `1px solid ${themeColors.border}`,
    borderRadius: "10px",
    color: themeColors.textPrimary,
    outline: "none",
    fontSize: "14px",
    marginTop: "6px",
    transition: "all 0.2s",
    fontFamily: "inherit"
  };

  const labelStyle = {
    fontSize: "13px",
    fontWeight: "600",
    color: themeColors.textSecondary,
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px"
  };

  // Animation styles
  const animationStyles = `
    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .modal-input:focus {
      outline: none;
      border-color: ${themeColors.accent} !important;
      box-shadow: 0 0 0 3px ${themeColors.accentGlow};
    }
    .file-input:hover {
      border-color: ${themeColors.accent};
      background: ${themeColors.accentGlow};
    }
    .submit-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px ${themeColors.accentGlow};
    }
  `;

  return (
    <>
      <style>{animationStyles}</style>
      
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: theme === "dark" ? "rgba(10, 10, 26, 0.95)" : "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100000,
          padding: "20px",
          backdropFilter: "blur(8px)",
          animation: "fadeIn 0.2s ease"
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: themeColors.cardBg,
            width: "100%",
            maxWidth: "650px",
            borderRadius: "24px",
            border: `1px solid ${themeColors.border}`,
            boxShadow: theme === "dark" ? "0 25px 50px rgba(0,0,0,0.5)" : "0 25px 50px rgba(0,0,0,0.15)",
            maxHeight: "90vh",
            overflowY: "auto",
            animation: "modalSlideIn 0.3s ease"
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "24px 28px",
              borderBottom: `1px solid ${themeColors.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: themeColors.bgInner
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <FaProjectDiagram size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: themeColors.textPrimary, fontSize: "1.25rem" }}>
                  Submit New Project
                </h3>
                <p style={{ margin: "4px 0 0 0", color: themeColors.textSecondary, fontSize: "13px" }}>
                  Share your college project for review
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: themeColors.accentGlow,
                border: "none",
                color: themeColors.textSecondary,
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = themeColors.danger;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = themeColors.accentGlow;
                e.currentTarget.style.color = themeColors.textSecondary;
              }}
            >
              <FaTimes />
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} style={{ padding: "28px" }}>
            {submitSuccess ? (
              <div
                style={{
                  padding: "40px 20px",
                  background: `${themeColors.success}20`,
                  borderRadius: "16px",
                  textAlign: "center",
                  border: `1px solid ${themeColors.success}`
                }}
              >
                <FaCheckCircle size={48} color={themeColors.success} style={{ marginBottom: "16px" }} />
                <h4 style={{ color: themeColors.success, marginBottom: "8px" }}>Project Submitted Successfully!</h4>
                <p style={{ color: themeColors.textSecondary, fontSize: "13px" }}>
                  Your project has been submitted for review
                </p>
              </div>
            ) : (
              <>
                {/* ROW 1 - Title & Domain */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={labelStyle}>
                      <FaFileAlt size={12} /> Project Title *
                    </label>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="e.g., E-Commerce Platform"
                      style={inputStyle}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <FaProjectDiagram size={12} /> Domain *
                    </label>
                    <select
                      className="modal-input"
                      style={{ ...inputStyle, cursor: "pointer" }}
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    >
                      <option value="Full Stack">🌐 Full Stack</option>
                      <option value="Backend">⚙️ Backend</option>
                      <option value="Frontend">🎨 Frontend</option>
                      <option value="AI/ML">🤖 AI/ML</option>
                      <option value="Mobile App">📱 Mobile App</option>
                    </select>
                  </div>
                </div>

                {/* ROW 2 - Database & Tech Stack */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                  <div>
                    <label style={labelStyle}>
                      <FaDatabase size={12} /> Database
                    </label>
                    <input
                      className="modal-input"
                      placeholder="e.g., PostgreSQL, MongoDB"
                      style={inputStyle}
                      value={formData.database_type}
                      onChange={(e) => setFormData({ ...formData, database_type: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <FaCode size={12} /> Tech Stack
                    </label>
                    <input
                      className="modal-input"
                      placeholder="e.g., React, Node.js, Python"
                      style={inputStyle}
                      value={formData.tech_stack}
                      onChange={(e) => setFormData({ ...formData, tech_stack: e.target.value })}
                    />
                  </div>
                </div>

                {/* Course Name */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>
                    <FaInfoCircle size={12} /> Course Name
                  </label>
                  <input
                    className="modal-input"
                    placeholder="e.g., Web Development, Data Structures"
                    style={inputStyle}
                    value={formData.course_name}
                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                  />
                </div>

                {/* File Upload */}
                <div style={{ marginBottom: "20px" }}>
                  <label style={labelStyle}>
                    <FaUpload size={12} /> Upload File *
                  </label>
                  <div
                    className="file-input"
                    style={{
                      border: `2px dashed ${themeColors.border}`,
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      marginTop: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      background: themeColors.accentGlow
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.style.borderColor = themeColors.accent;
                      e.currentTarget.style.background = themeColors.accentGlow;
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.borderColor = themeColors.border;
                      e.currentTarget.style.background = themeColors.accentGlow;
                    }}
                    onClick={() => document.getElementById("file-input").click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      style={{ display: "none" }}
                      onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                      required
                    />
                    <FaUpload size={32} color={themeColors.textSecondary} style={{ marginBottom: "12px" }} />
                    <p style={{ color: themeColors.textSecondary, marginBottom: "4px", fontSize: "14px" }}>
                      {formData.file ? formData.file.name : "Click or drag to upload"}
                    </p>
                    <p style={{ color: themeColors.textSecondary, fontSize: "12px", opacity: 0.7 }}>
                      ZIP, RAR, or project folder (Max 50MB)
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={labelStyle}>
                    <FaInfoCircle size={12} /> Description
                  </label>
                  <textarea
                    rows="4"
                    className="modal-input"
                    placeholder="Describe your project, features, and technologies used..."
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Error Message */}
                {submitError && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: `${themeColors.danger}20`,
                      border: `1px solid ${themeColors.danger}`,
                      borderRadius: "10px",
                      marginBottom: "20px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: themeColors.danger,
                      fontSize: "13px"
                    }}
                  >
                    <FaExclamationTriangle size={14} />
                    {submitError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="submit-btn"
                  style={{
                    width: "100%",
                    padding: "14px",
                    background: `linear-gradient(135deg, ${themeColors.accent}, #4c51bf)`,
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontWeight: "600",
                    fontSize: "15px",
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  {submitting ? (
                    <>
                      <FaSpinner style={{ animation: "spin 1s linear infinite" }} />
                      Submitting Project...
                    </>
                  ) : (
                    <>
                      <FaUpload size={14} />
                      Submit Project
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default ProjectSubmissionModal;