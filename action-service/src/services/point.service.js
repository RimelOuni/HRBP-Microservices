const axios = require("axios");

const BASE    = () => process.env.POINT_SERVICE_URL; // http://localhost:3007
const headers = (token) => ({ Authorization: `Bearer ${token}` });
const TIMEOUT = 8000;

/**
 * Récupère un point par son ID depuis le point-service.
 * Renvoie null si introuvable (jamais de throw).
 * Le point-service renvoie { success, data }, on déballe directement.
 */
const getPointById = async (pointId, token) => {
  if (!pointId) return null;
  try {
    const { data } = await axios.get(`${BASE()}/api/points/${pointId}`, {
      headers: headers(token),
      timeout: TIMEOUT,
    });
    return data?.data || data;
  } catch (err) {
    if (err.response && err.response.status === 404) return null;
    console.error(`[action-service] point.service getPointById(${pointId}) failed:`, err.message);
    return null;
  }
};

/**
 * Récupère un snapshot léger d'un point (équivalent .populate("point_id", "titre date")).
 */
const getPointSnapshot = async (pointId, token) => {
  const p = await getPointById(pointId, token);
  if (!p) return null;
  return {
    _id:   p._id,
    titre: p.titre,
    date:  p.date,
  };
};

module.exports = { getPointById, getPointSnapshot };
