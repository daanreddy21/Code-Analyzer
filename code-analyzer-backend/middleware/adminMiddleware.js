function adminOnly(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admin only."
    });
  }
  next();
}

module.exports = adminOnly;  // ✅ CRITICAL: This was missing!
