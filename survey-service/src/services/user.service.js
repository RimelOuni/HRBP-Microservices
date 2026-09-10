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
    return data;
  } catch (err) {
    console.error(`[survey-service] user.service getUserById(${userId}) failed:`, err.message);
    return null;
  }
};


const getUserSnapshot = async (userId, token) => {
  const u = await getUserById(userId, token);
  return mapUser(u);
};

/**
 * Résout l'utilisateur courant via /api/users/me (keycloakId → id interne).
 * Indispensable puisque le token Keycloak ne contient plus l'ID user-service.
 */
const getCurrentUserProfile = async (token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/users/me`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return mapUser(data);
  } catch (err) {
    console.error("[survey-service] user.service getCurrentUserProfile failed:", err.message);
    return null;
  }
};


const incrementGamification = async (userId, { pointsDelta, surveysDelta }, token) => {
  try {
    const { data } = await axios.patch(
      `${BASE()}/api/users/${userId}/gamification`,
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
  getCurrentUserProfile,
  incrementGamification,
};