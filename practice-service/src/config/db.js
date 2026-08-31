const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[practice-service] MongoDB Atlas connecté → practice-db");
  } catch (error) {
    console.error("[practice-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
