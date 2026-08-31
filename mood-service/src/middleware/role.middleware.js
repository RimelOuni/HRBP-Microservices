const roleMiddleware = (allowedRoles = []) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Accès refusé. Rôles autorisés : ${allowedRoles.join(", ")}`,
    });
  }
  next();
};

module.exports = roleMiddleware;
