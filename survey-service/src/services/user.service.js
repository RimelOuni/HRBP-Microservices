const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // http://localhost:5000
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Récupère un user complet par son ID depuis le monolithe.
 * Renvoie null si introuvable (jamais de throw).
 */
const getUserById = async (userId, token) => {
  if (!userId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/user/${userId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return data?.data || data;
  } catch (err) {
    console.error(`[survey-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};

/**
 * Normalise practice_id en tableau de strings, quel que soit le format
 * renvoyé par le user-service.
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
 * Récupère un snapshot minimal d'un user (pour populate côté survey-service).
 */
const getUserSnapshot = async (userId, token) => {
  const u = await getUserById(userId, token);
  if (!u) return null;
  return {
    _id:         u._id,
    firstName:   u.firstName  || u.first_name,
    lastName:    u.lastName   || u.last_name,
    email:       u.email,
    practice_id: normalizePracticeIds(u.practice_id),
    role:        u.role || null,
  };
};

/**
 * Incrémente les compteurs de gamification d'un user via une route
 * dédiée du user-service (PATCH /api/user/:id/gamification).
 * Renvoie { points, surveysAnswered } mis à jour, ou null en cas d'échec.
 */
const incrementGamification = async (userId, { pointsDelta, surveysDelta }, token) => {
  try {
    const { data } = await axios.patch(
      `${BASE()}/api/user/${userId}/gamification`,
      { pointsDelta, surveysDelta },
      { headers: headers(token), timeout: TIMEOUT }
    );
    return data?.data || data;
  } catch (err) {
    console.error(`[survey-service] user.service incrementGamification(${userId}) failed:`, err.message);
    return null;
  }
};

module.exports = {
  getUserById,
  getUserSnapshot,
  incrementGamification,
  normalizePracticeIds,
};
