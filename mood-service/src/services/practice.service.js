const axios = require("axios");

const BASE    = () => process.env.PRACTICE_SERVICE_URL; // http://localhost:3005
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Récupère toutes les practices actives depuis le practice-service.
 */
const getActivePractices = async (token) => {
  try {
    const { data } = await axios.get(`${BASE()}/api/practices`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.error("[point-service] practice.service getActivePractices failed:", err.message);
    return [];
  }
};

/**
 * Vérifie qu'une practice existe. Retourne l'objet ou null (jamais de throw).
 */
const getPracticeById = async (practiceId, token) => {
  if (!practiceId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/practices/${practiceId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return data?.data || data;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    console.error(`[point-service] practice.service getPracticeById(${practiceId}) failed:`, err.message);
    return null;
  }
};

module.exports = { getActivePractices, getPracticeById };
