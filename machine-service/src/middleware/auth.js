const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_production";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

/**
 * requireAuth — verifies the JWT token on every protected request
 * Also accepts internal service calls via x-internal-key header
 * Attaches the decoded user object to req.user
 */
function requireAuth(req, res, next) {
  // Allow internal service-to-service calls
  if (INTERNAL_API_KEY && req.headers["x-internal-key"] === INTERNAL_API_KEY) {
    req.user = { role: "internal" };
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

/**
 * requireAdmin — must be used after requireAuth
 * Blocks non-admin users from accessing admin-only routes
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin access required" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };