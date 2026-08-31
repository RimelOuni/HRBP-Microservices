const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[action-service] MongoDB Atlas connecté → action-db");
  } catch (error) {
    console.error("[action-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
