import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/code/share/${token}`)
      .then(res => res.json())
      .then(setData);
  }, [token]);

  if (!data) return <h2>Loading...</h2>;
  if (data.error) return <h2>{data.error}</h2>;

  // ================= VIEW TYPE =================
  if (data.type === "view") {
    return (
      <div style={{ padding: "40px", background: "#0a0f1e", minHeight: "100vh", color: "white" }}>
        <h2>📄 {data.file_name}</h2>

        <div style={{
          background: "#1e1e2f",
          padding: "20px",
          borderRadius: "10px",
          marginTop: "20px"
        }}>
          <pre style={{ whiteSpace: "pre-wrap" }}>{data.code}</pre>
        </div>

        <button
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            background: "#22c55e",
            border: "none",
            borderRadius: "8px",
            color: "white"
          }}
          onClick={() => {
            const blob = new Blob([data.code], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = data.file_name || "code.txt";
            a.click();
          }}
        >
          ⬇ Download Code
        </button>
      </div>
    );
  }

  // ================= ANALYZE TYPE =================
  if (data.type === "analyze") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0a0f1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <div style={{
          background: "white",
          width: "95%",
          maxWidth: "1200px",
          height: "90vh",
          borderRadius: "28px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>

          {/* HEADER */}
          <div style={{
            padding: "1.5rem 2.5rem",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2>🚀 Code Analysis Report</h2>

            <div style={{ textAlign: "right" }}>
              <div style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: data.score > 70 ? "#16a34a" : "#ef4444"
              }}>
                {data.score}/100
              </div>
              <div>FINAL SCORE</div>
            </div>
          </div>

          {/* BODY */}
          <div style={{ display: "flex", flex: 1 }}>

            {/* LEFT - CODE */}
            <div style={{
              flex: 1,
              background: "#1e1e1e",
              padding: "20px",
              overflow: "auto",
              color: "#d4d4d4"
            }}>
              <pre>{data.code}</pre>
            </div>

            {/* RIGHT - ISSUES */}
            <div style={{
              flex: 1,
              padding: "20px",
              overflowY: "auto"
            }}>
              <h3>Detected Issues ({data.issues.length})</h3>

              {data.issues.map((issue, i) => (
                <div key={i} style={{
                  marginBottom: "15px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px"
                }}>
                  <div style={{
                    padding: "10px",
                    background: "#fef2f2",
                    fontWeight: "bold"
                  }}>
                    {issue.title}
                  </div>
                  <div style={{ padding: "10px" }}>
                    💡 {issue.suggestion}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FOOTER */}
          <div style={{
            padding: "20px",
            display: "flex",
            gap: "10px"
          }}>
            <button
              style={{ flex: 1, background: "#0ea5e9", color: "white" }}
              onClick={() => {
                const text = data.issues.map(i => i.title).join("\n");
                navigator.clipboard.writeText(text);
                alert("Copied!");
              }}
            >
              Copy Issues
            </button>

            <button
              style={{ flex: 1, background: "#22c55e", color: "white" }}
              onClick={() => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "report.txt";
                a.click();
              }}
            >
              Download Report
            </button>
          </div>

        </div>
      </div>
    );
  }
}

export default SharePage;