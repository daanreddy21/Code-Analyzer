import axios from "axios";

// 🔹 Create Axios Instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000, // optional (10 sec timeout)
});

// 🔹 Request Interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    // ✅ Attach token if available
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Handle FormData properly
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    } else {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔹 Response Interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;

      // 🔥 Unauthorized
      if (status === 401) {
        console.error("🚫 Unauthorized! Redirecting to login...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
      }

      // 🔥 Forbidden
      if (status === 403) {
        console.warn("⏳ Access denied / waiting for approval");
      }

      // 🔥 Server Error
      if (status === 500) {
        console.error("💥 Server error occurred");
      }
    } else {
      console.error("🌐 Network Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default API;