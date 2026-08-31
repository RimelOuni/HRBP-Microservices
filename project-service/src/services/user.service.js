const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // http://localhost:5000
const headers = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * Récupère un user par son ID (pour résoudre le manager).
 */
const getUserById = async (userId, token) => {
  const { data } = await axios.get(`${BASE()}/api/user/${userId}`, {
    headers: headers(token),
  });
  return data;
};

/**
 * Récupère plusieurs users par leurs IDs.
 */
const getUsersByIds = async (userIds, token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(
    userIds.map((id) => getUserById(id, token))
  );
  return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
};

/**
 * Récupère les users d'une practice filtrés par rôle (ex: MANAGER).
 */
const getUsersByPracticeAndRole = async (practiceId, role, token) => {
  const { data } = await axios.get(`${BASE()}/api/user`, {
    params: { practice_id: practiceId, role },
    headers: headers(token),
  });
  return data;
};

module.exports = { getUserById, getUsersByIds, getUsersByPracticeAndRole };
