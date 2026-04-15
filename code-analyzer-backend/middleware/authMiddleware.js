const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  let authHeader = req.headers["authorization"];

  let token;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "");
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");

    // ✅ OLD (keep for existing controllers)
    req.userId = decoded.id;
    req.userRole = decoded.role || "user";

    // ✅ NEW (for new features)
    req.user = {
      id: decoded.id,
      role: decoded.role || "user"
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = authenticateToken;