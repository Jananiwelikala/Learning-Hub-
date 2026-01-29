// Backend/Middleware/role.js
function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    // auth middleware must run first and set req.user
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // only allow if user's role matches the required role
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = roleMiddleware;

module.exports = function(requiredRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== requiredRole) return res.status(403).json({ message: "Access denied" });
    next();
  };
};
