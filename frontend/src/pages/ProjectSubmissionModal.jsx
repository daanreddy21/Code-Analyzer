import { useState } from "react";
import API from "../services/api";

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
      onSuccess();
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
    padding: "10px 12px",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: "6px",
    color: "#c9d1d9",
    outline: "none",
    fontSize: "14px",
    marginTop: "5px"
  };

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "500",
    color: "#f0f6fc",
    display: "block"
  };

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(13, 17, 23, 0.85)", 
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10000, padding: "20px", backdropFilter: "blur(4px)"
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: "#161b22", 
          width: "100%", maxWidth: "600px", 
          borderRadius: "12px", border: "1px solid #30363d",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          maxHeight: "90vh", overflowY: "auto"
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          padding: "20px 24px", 
          borderBottom: "1px solid #30363d",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h3 style={{ margin: 0, color: "#f0f6fc", fontSize: "18px" }}>📁 Submit College Project</h3>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", color: "#8b949e", fontSize: "24px", cursor: "pointer" }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {submitSuccess ? (
            <div style={{ 
              padding: "20px", background: "rgba(63, 185, 80, 0.1)", 
              color: "#3fb950", borderRadius: "6px", textAlign: "center", fontWeight: "600" 
            }}>
              ✅ Project submitted successfully!
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Project Title *</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="E-commerce App"
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Domain *</label>
                  <select 
                    style={inputStyle}
                    value={formData.domain} 
                    onChange={(e) => setFormData({...formData, domain: e.target.value})}
                    required
                  >
                    <option value="Full Stack">Full Stack</option>
                    <option value="Backend">Backend</option>
                    <option value="Frontend">Frontend</option>
                    <option value="AI/ML">AI/ML</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Database Used</label>
                  <select
                    style={inputStyle}
                    value={formData.database_type}
                    onChange={(e) => setFormData({...formData, database_type: e.target.value})}
                  >
                    <option value="">NA</option>
                    <option value="PostgreSQL">PostgreSQL</option>
                    <option value="MySQL">MySQL</option>
                    <option value="MongoDB">MongoDB</option>
                    <option value="SQLite">SQLite</option>
                    <option value="Firebase">Firebase</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Tech Stack</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={formData.tech_stack}
                    onChange={(e) => setFormData({...formData, tech_stack: e.target.value})}
                    placeholder="React, Node.js"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div>
                  <label style={labelStyle}>Course Name</label>
                  <input
                    type="text"
                    style={inputStyle}
                    value={formData.course_name}
                    onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                    placeholder="Computer Science"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Project Files * (ZIP/PDF)</label>
                  <input
                    type="file"
                    accept=".zip,.pdf,.doc,.docx"
                    style={{ ...inputStyle, padding: "8px" }}
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>Project Description</label>
                <textarea
                  rows="3"
                  style={{ ...inputStyle, resize: "none" }}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of your project..."
                />
              </div>

              {submitError && (
                <div style={{ 
                  marginBottom: "20px", padding: "10px", 
                  background: "rgba(248, 81, 73, 0.1)", color: "#f85149", 
                  borderRadius: "6px", fontSize: "14px", border: "1px solid rgba(248, 81, 73, 0.4)" 
                }}>
                  {submitError}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={submitting} 
                style={{ 
                  width: "100%", padding: "12px", 
                  background: "#238636", color: "#fff", 
                  border: "none", borderRadius: "6px", 
                  fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => !submitting && (e.target.style.background = "#2ea043")}
                onMouseOut={(e) => !submitting && (e.target.style.background = "#238636")}
              >
                {submitting ? "⏳ Submitting..." : "🚀 Submit Project"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProjectSubmissionModal;