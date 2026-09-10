const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL;
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

function mapUser(u) {
  if (!u) return null;
  return {
    _id:         u.id,
    first_name:  u.prenom,
    last_name:   u.nom,
    email:       u.email,
    role:        u.role || null,
    practice_id: u.practiceId ? [String(u.practiceId)] : [],
  };
}

const getUserById = async (userId, token) => {
  if (!userId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/users/${userId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return mapUser(data);
  } catch (err) {
    console.error(`[satisfaction-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};

const getUsersByIds = async (userIds = [], token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(
    userIds.map((id) => getUserById(id.toString(), token))
  );
  return results.filter((r) => r.status === "fulfilled" && r.value).map((r) => r.value);
};

const getUserSnapshot = async (userId, token) => getUserById(userId, token);

/**
 * Résout l'utilisateur courant via /api/users/me (keycloakId → entity id),
 * nécessaire pour rattacher les satisfactions au bon collaborateur.
 */
const getCurrentUserProfile = async (token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/users/me`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return mapUser(data);
  } catch (err) {
    console.error("[satisfaction-service] user.service getCurrentUserProfile failed:", err.message);
    return null;
  }
};

module.exports = { getUserById, getUsersByIds, getUserSnapshot, getCurrentUserProfile };