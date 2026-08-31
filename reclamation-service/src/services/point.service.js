const axios = require("axios");

const POINT_SERVICE_URL = process.env.POINT_SERVICE_URL;

/** Récupère un point complet (pour vérifier l'appartenance et construire le snapshot) */
const getPointById = async (pointId, token) => {
  try {
    const res = await axios.get(`${POINT_SERVICE_URL}/api/points/${pointId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data?.data || res.data;
  } catch (err) {
    console.error("[reclamation-service] getPointById error:", err.message);
    return null;
  }
};

module.exports = { getPointById };