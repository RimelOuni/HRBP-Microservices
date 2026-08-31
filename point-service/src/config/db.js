const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[point-service] MongoDB Atlas connecté → point-db");
  } catch (error) {
    console.error("[point-service] Connexion échouée :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
