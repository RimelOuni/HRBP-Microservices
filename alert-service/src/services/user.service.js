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
    photo_url:  u.photoUrl || null,
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
    console.error(`[alert-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};

const getCreatedBySnapshot = async (userId, token) => getUserById(userId, token);
const getDestinationSnapshot = async (userId, token) => getUserById(userId, token);

/**
 * Résout l'utilisateur courant via /api/users/me (keycloakId → entity id),
 * nécessaire pour obtenir l'ID à stocker comme created_by.
 */
const getCurrentUserProfile = async (token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/users/me`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return mapUser(data);
  } catch (err) {
    console.error("[alert-service] user.service getCurrentUserProfile failed:", err.message);
    return null;
  }
};

module.exports = { getUserById, getCreatedBySnapshot, getDestinationSnapshot, getCurrentUserProfile };