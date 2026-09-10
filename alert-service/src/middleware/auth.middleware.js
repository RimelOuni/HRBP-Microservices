const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

const KEYCLOAK_JWKS_URL = process.env.KEYCLOAK_JWKS_URL || "http://core-keycloak:8180";
const KEYCLOAK_ISSUER_URL = process.env.KEYCLOAK_ISSUER_URL || "http://localhost:8180";
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || "entreprise-realm";

const client = jwksClient({
  jwksUri: `${KEYCLOAK_JWKS_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token manquant" });
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    getSigningKey,
    {
      algorithms: ["RS256"],
      issuer: `${KEYCLOAK_ISSUER_URL}/realms/${KEYCLOAK_REALM}`,
    },
    (err, decoded) => {
      if (err) {
        console.error(">>> [alert-service] auth.middleware verify failed:", err.name, "-", err.message);
        return res.status(401).json({ message: "Token invalide ou expiré" });
      }
      req.user = {
        keycloakId: decoded.sub,
        email: decoded.email,
        firstName: decoded.given_name,
        lastName: decoded.family_name,
        roles: decoded.realm_access?.roles || [],
        practiceId: decoded.practice_id,
        roId: decoded.ro_id,
        ccId: decoded.cc_id,
      };
      next();
    }
  );
};

module.exports = authMiddleware;