const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL;
const headers = (token) => ({ Authorization: `Bearer ${token}` });

function mapUser(u) {
  if (!u) return null;
  return {
    _id:        u.id,
    first_name: u.prenom,
    last_name:  u.nom,
    email:      u.email,
    role:       u.role,
    is_active:  u.active,
  };
}

const getUserById = async (userId, token) => {
  const { data } = await axios.get(`${BASE()}/api/users/${userId}`, { headers: headers(token) });
  return mapUser(data);
};

const getUsersByIds = async (userIds, token) => {
  if (!userIds || userIds.length === 0) return [];
  const results = await Promise.allSettled(userIds.map((id) => getUserById(id, token)));
  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
};

const getUsersByPracticeAndRole = async (practiceId, role, token) => {
  const { data } = await axios.get(`${BASE()}/api/users`, {
    params: { practice_id: practiceId, role },
    headers: headers(token),
  });
  return data.map(mapUser);
};

module.exports = { getUserById, getUsersByIds, getUsersByPracticeAndRole };