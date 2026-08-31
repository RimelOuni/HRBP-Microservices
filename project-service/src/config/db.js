const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[project-service] MongoDB Atlas connecté → project-db");
  } catch (error) {
    console.error("[project-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
