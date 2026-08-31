const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[badge-service] MongoDB Atlas connecté → badge-db");
  } catch (error) {
    console.error("[badge-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
