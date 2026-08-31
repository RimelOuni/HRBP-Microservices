const axios = require("axios");

const BASE    = () => process.env.USER_SERVICE_URL; // http://localhost:5000
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Récupère un user par son ID depuis le monolithe.
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
    console.error(`[alert-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};

/**
 * Snapshot created_by → { _id, first_name, last_name, email, photo_url }
 * Équivalent de .populate("created_by", "first_name last_name email photo_url")
 */
const getCreatedBySnapshot = async (userId, token) => {
  const u = await getUserById(userId, token);
  if (!u) return null;
  return {
    _id:        u._id,
    first_name: u.first_name,
    last_name:  u.last_name,
    email:      u.email,
    photo_url:  u.photo_url || null,
  };
};

/**
 * Snapshot destination_user_id → { _id, first_name, last_name, email, role }
 * Équivalent de .populate("destination_user_id", "first_name last_name email role")
 */
const getDestinationSnapshot = async (userId, token) => {
  const u = await getUserById(userId, token);
  if (!u) return null;
  return {
    _id:        u._id,
    first_name: u.first_name,
    last_name:  u.last_name,
    email:      u.email,
    role:       u.role || null,
  };
};

module.exports = { getUserById, getCreatedBySnapshot, getDestinationSnapshot };
