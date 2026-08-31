const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[survey-service] MongoDB Atlas connecté → survey-db");
  } catch (error) {
    console.error("[survey-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;