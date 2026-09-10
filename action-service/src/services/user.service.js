const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL;
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

function mapUser(u) {
  if (!u) return null;
  return {
    _id:        u.id,
    first_name: u.prenom,
    last_name:  u.nom,
    email:      u.email,
    role:       u.role,
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
    console.error(`[action-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};

const getUserSnapshot = async (userId, token) => {
  return getUserById(userId, token); 
};


const getCurrentUserProfile = async (token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/users/me`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return mapUser(data);
  } catch (err) {
    console.error("[action-service] user.service getCurrentUserProfile failed:", err.message);
    return null;
  }
};

module.exports = { getUserById, getUserSnapshot, getCurrentUserProfile };