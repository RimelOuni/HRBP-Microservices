require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const eurekaClient = require("./src/config/eureka");

const PORT = parseInt(process.env.PORT, 10) || 3005;

// ===============================
// Connexion MongoDB
// ===============================
connectDB();

// ===============================
// Endpoint Health
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "practice-service",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// Démarrage du serveur
// ===============================
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[practice-service] Port : ${PORT}`);
  console.log(
    `[practice-service] Health : http://localhost:${PORT}/health`
  );
  console.log("=====================================");

  // Enregistrement dans Eureka
  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka");
      console.error(error);
    } else {
      console.log("✅ Practice-Service enregistré dans Eureka");
    }
  });
});

// ===============================
// Arrêt propre
// ===============================
const shutdown = () => {
  console.log("\n🛑 Arrêt du PRACTICE-SERVICE...");

  eurekaClient.stop(() => {
    console.log("🛑 Déconnecté de Eureka");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);