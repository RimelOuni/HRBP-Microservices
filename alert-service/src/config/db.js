const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[alert-service] MongoDB Atlas connecté → alert-db");
  } catch (error) {
    console.error("[alert-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
