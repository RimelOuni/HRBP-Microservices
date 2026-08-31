const axios = require("axios");

const BASE    = () => process.env.POINT_SERVICE_URL; // http://localhost:3007
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Snapshot point_id → { _id, titre }
 * Équivalent de .populate("point_id", "titre")
 * Version enrichie pour getAlertsByManager → { _id, titre, criticite, status }
 */
const getPointSnapshot = async (pointId, token, fields = ["titre"]) => {
  if (!pointId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/points/${pointId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    const p = data?.data || data;
    if (!p) return null;

    const snapshot = { _id: p._id };
    if (fields.includes("titre"))    snapshot.titre    = p.titre;
    if (fields.includes("criticite")) snapshot.criticite = p.criticite;
    if (fields.includes("status"))   snapshot.status   = p.status;
    return snapshot;
  } catch (err) {
    if (err.response?.status === 404) return null;
    console.error(`[alert-service] point.service getPointSnapshot(${pointId}) failed:`, err.message);
    return null;
  }
};

module.exports = { getPointSnapshot };
