const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // ex: http://localhost:8088
const headers = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * Convertit le format Java (camelCase) vers le format attendu par
 * practice.controller.js (snake_case, cohérent avec l'ancien monolithe/frontend).
 */
function mapUser(u) {
  if (!u) return null;
  return {
    _id:         u.id,
    first_name:  u.prenom,
    last_name:   u.nom,
    email:       u.email,
    role:        u.role,
    is_active:   u.active,
    practice_id: u.practiceIds || [],
    ro_id:       u.roId || null,
    cc_id:       u.ccId || null,
    grade:       u.grade || "",
    phone:       u.phone || "",
    photo_url:   u.photoUrl || "",
  };
}

const getUserById = async (userId, token) => {
  const { data } = await axios.get(`${BASE()}/api/users/${userId}`, { headers: headers(token) });
  return mapUser(data);
};

const getUsersByIds = async (userIds, token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(
    userIds.map((id) => getUserById(id, token))
  );
  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
};

const getUsersByPracticeAndRole = async (practiceId, role, token, hrbpId = null) => {
  const params = { practice_id: practiceId, role };
  if (hrbpId) params.ro_id = hrbpId;
  const { data } = await axios.get(`${BASE()}/api/users`, { params, headers: headers(token) });
  return data.map(mapUser);
};

const getUsersByRole = async (role, token) => {
  const { data } = await axios.get(`${BASE()}/api/users`, {
    params: { role, is_active: true },
    headers: headers(token),
  });
  return data.map(mapUser);
};

module.exports = {
  getUserById,
  getUsersByIds,
  getUsersByPracticeAndRole,
  getUsersByRole,
};