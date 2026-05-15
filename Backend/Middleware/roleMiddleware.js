// Authorizes access by checking req.user.role against allowed roles.
function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // allow either: roleMiddleware("admin") OR roleMiddleware(["admin","teacher"])
    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    const userRole = String(req.user.role || "").toLowerCase();
    const allowedRoles = rolesArray.map((role) => String(role).toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Please login with a ${allowedRoles.join(" or ")} account.`,
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
