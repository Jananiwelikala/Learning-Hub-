const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Validates Bearer token and attaches decoded user payload to req.user.
async function authMiddleware(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured" });
    }

    // Accept: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization || "";
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ success: false, message: "No token, access denied" });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name role email");

    if (!user) {
      return res.status(401).json({ success: false, message: "User account not found" });
    }

    req.user = {
      ...decoded,
      id: decoded.id,
      name: user.name || decoded.name,
      role: String(user.role || decoded.role || "").toLowerCase(),
      email: user.email || decoded.email,
    };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

module.exports = authMiddleware;
