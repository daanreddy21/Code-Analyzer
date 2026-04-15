import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function FileList() {
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/files", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExplain = (file) => {
    navigate("/explain", { state: file });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📂 My Files</h2>
      <table border="1" width="100%">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Language</th>
            <th>Status</th>
            <th>Explain</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.file_name}</td>
              <td>{file.language}</td>
              <td>{file.status}</td>
              <td>
                <button onClick={() => handleExplain(file)}>
                  🧠 Explain
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FileList;