const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // http://localhost:5000
const headers = (token) => ({ Authorization: `Bearer ${token}` });

// Récupérer un user par ID
const getUserById = async (userId, token) => {
  const { data } = await axios.get(`${BASE()}/api/user/${userId}`, { headers: headers(token) });
  return data;
};

// Récupérer plusieurs users par leurs IDs (pour résoudre hrbp[])
const getUsersByIds = async (userIds, token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(
    userIds.map((id) => getUserById(id, token))
  );
  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
};

// Récupérer les users d'une practice par rôle (COLLABORATOR, MANAGER)
const getUsersByPracticeAndRole = async (practiceId, role, token, hrbpId = null) => {
  const params = { practice_id: practiceId, role };
  if (hrbpId) params.ro_id = hrbpId;
  const { data } = await axios.get(`${BASE()}/api/user`, { params, headers: headers(token) });
  return data;
};

// Récupérer les users actifs par rôle (ex: tous les HRBP)
const getUsersByRole = async (role, token) => {
  const { data } = await axios.get(`${BASE()}/api/user`, {
    params: { role, is_active: true },
    headers: headers(token),
  });
  return data;
};

// Mise à jour en masse (assign / remove HRBP)
const bulkUpdateUsers = async (userIds, updatePayload, token) => {
  const { data } = await axios.patch(
    `${BASE()}/api/user/bulk-update`,
    { userIds, update: updatePayload },
    { headers: headers(token) }
  );
  return data;
};

module.exports = {
  getUserById,
  getUsersByIds,
  getUsersByPracticeAndRole,
  getUsersByRole,
  bulkUpdateUsers,
};
