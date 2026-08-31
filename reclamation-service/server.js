require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const eurekaClient = require("./src/config/eureka");

const PORT = parseInt(process.env.PORT, 10) || 3016;

connectDB();

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "reclamation-service",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[reclamation-service] Port : ${PORT}`);
  console.log(`[reclamation-service] Health : http://localhost:${PORT}/health`);
  console.log("=====================================");

  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka");
      console.error(error);
    } else {
      console.log("✅ Reclamation-Service enregistré dans Eureka");
    }
  });
});

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