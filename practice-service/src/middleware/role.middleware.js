/**
 * role.middleware.js
 * Doit être placé APRÈS auth.middleware.js dans la chaîne des routes,
 * car il dépend de req.user rempli par ce dernier.
 */
const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Non authentifié" });
    }

    const userRoles = req.user.roles || []; // tableau, cf. auth.middleware.js

    const hasAccess = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasAccess) {
      return res.status(403).json({
        message: `Accès refusé : rôle requis parmi [${allowedRoles.join(", ")}]`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;