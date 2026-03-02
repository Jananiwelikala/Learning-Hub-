// Authorizes access by checking req.user.role against allowed roles.
function roleMiddleware(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // allow either: roleMiddleware("admin") OR roleMiddleware(["admin","teacher"])
    const rolesArray = Array.isArray(requiredRoles)
      ? requiredRoles
      : [requiredRoles];

    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
}

module.exports = roleMiddleware;
