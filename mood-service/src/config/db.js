const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[mood-service] MongoDB connecté`);
    console.log(`[mood-service] Base : ${conn.connection.name}`);
  } catch (error) {
    console.error(`[mood-service] ❌ Erreur connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;