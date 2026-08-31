const axios = require("axios");

const BASE    = () => process.env.PRACTICE_SERVICE_URL; // http://localhost:3005
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Snapshot practiceId → { _id, name }
 * Équivalent de .populate("practiceId", "name")
 */
const getPracticeSnapshot = async (practiceId, token) => {
  if (!practiceId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/practices/${practiceId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    const p = data?.data || data;
    return p ? { _id: p._id, name: p.name } : null;
  } catch (err) {
    if (err.response?.status === 404) return null;
    console.error(`[badge-service] practice.service getPracticeSnapshot(${practiceId}) failed:`, err.message);
    return null;
  }
};

module.exports = { getPracticeSnapshot };
