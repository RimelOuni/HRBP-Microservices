const roleMiddleware = (allowedRoles = []) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const userRoles = req.user.roles || [];
  const hasAccess = allowedRoles.some((r) => userRoles.includes(r));
  if (!hasAccess) {
    return res.status(403).json({
      message: `Accès refusé. Rôles autorisés : ${allowedRoles.join(", ")}`,
    });
  }
  next();
};

module.exports = roleMiddleware;