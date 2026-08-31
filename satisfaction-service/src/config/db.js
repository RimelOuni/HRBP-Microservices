const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[satisfaction-service] MongoDB connecté`);
    console.log(`[satisfaction-service] Base : ${conn.connection.name}`);
  } catch (error) {
    console.error(`[satisfaction-service] ❌ Erreur connexion MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;