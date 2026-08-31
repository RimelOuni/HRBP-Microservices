const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // http://localhost:5000
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Récupère un user par son ID depuis le user-service (monolithe).
 */
const getUserById = async (userId, token) => {
  const { data } = await axios.get(`${BASE()}/api/user/${userId}`, {
    headers: headers(token),
    timeout: TIMEOUT,
  });
  // Le monolithe peut renvoyer { data: {...} } ou directement {...}
  return data?.data || data;
};

/**
 * Récupère plusieurs users en parallèle.
 * Renvoie uniquement ceux trouvés (échecs silencieux, jamais de throw).
 */
const getUsersByIds = async (userIds = [], token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(
    userIds.map((id) => getUserById(id.toString(), token))
  );
  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);
};

/**
 * Normalise practice_id en tableau de strings, quel que soit le format
 * renvoyé par le user-service (ObjectId unique, tableau d'IDs, tableau peuplé...).
 */
function normalizePracticeIds(practice_id) {
  if (!practice_id) return [];
  const arr = Array.isArray(practice_id) ? practice_id : [practice_id];
  return arr
    .map((p) => (typeof p === "object" && p !== null ? p._id : p))
    .filter(Boolean)
    .map((p) => p.toString());
}

/**
 * Récupère un snapshot minimal d'un user, avec practice_id toujours
 * normalisé en tableau de strings. Retourne null si introuvable.
 */
const getUserSnapshot = async (userId, token) => {
  if (!userId) return null;
  try {
    const u = await getUserById(userId.toString(), token);
    if (!u) return null;
    return {
      _id:         u._id,
      first_name:  u.first_name,
      last_name:   u.last_name,
      email:       u.email,
      photo_url:   u.photo_url || null,
      grade:       u.grade     || null,
      role:        u.role      || null,
      practice_id: normalizePracticeIds(u.practice_id),
    };
  } catch (err) {
    console.error(`[point-service] user.service getUserSnapshot(${userId}) failed:`, err.message);
    return null;
  }
};

module.exports = { getUserById, getUsersByIds, getUserSnapshot, normalizePracticeIds };
