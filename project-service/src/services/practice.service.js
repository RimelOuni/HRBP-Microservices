const axios = require("axios");

const BASE    = () => process.env.PRACTICE_SERVICE_URL; // http://localhost:3005
const headers = (token) => ({ Authorization: `Bearer ${token}` });

/**
 * Vérifie qu'une practice existe en interrogeant le practice-service.
 * Renvoie l'objet practice ou null si introuvable.
 */
const getPracticeById = async (practiceId, token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/practices/${practiceId}`, {
      headers: headers(token),
    });
    return data;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    throw err;
  }
};

module.exports = { getPracticeById };
