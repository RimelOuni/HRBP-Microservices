require("dotenv").config();

const app          = require("./src/app");
const connectDB    = require("./src/config/db");
const eurekaClient = require("./src/config/eureka");

const PORT = parseInt(process.env.PORT, 10) || 3009;

// Connexion MongoDB
connectDB();

// Endpoint Health
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "action-service",
    timestamp: new Date().toISOString(),
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[action-service] Port : ${PORT}`);
  console.log(`[action-service] Health : http://localhost:${PORT}/health`);
  console.log("=====================================");

  // Enregistrement dans Eureka
  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka");
      console.error(error);
    } else {
      console.log("✅ Action-Service enregistré dans Eureka");
    }
  });
});

// Arrêt propre
process.on("SIGINT", () => {
  eurekaClient.stop(() => {
    console.log("🛑 Déconnecté de Eureka");
    process.exit();
  });
});

process.on("SIGTERM", () => {
  eurekaClient.stop(() => {
    console.log("🛑 Déconnecté de Eureka");
    process.exit();
  });
});