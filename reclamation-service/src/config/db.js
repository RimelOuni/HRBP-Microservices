const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[reclamation-service] MongoDB connecté`);
    console.log(`[reclamation-service] Base : ${conn.connection.name}`);
  } catch (error) {
    console.error(`[reclamation-service] ❌ Erreur connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;