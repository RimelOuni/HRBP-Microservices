require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const eurekaClient = require("./src/config/eureka");

const PORT = parseInt(process.env.PORT, 10) || 3015;

connectDB();

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "pointrequest-service",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[pointrequest-service] Port : ${PORT}`);
  console.log(`[pointrequest-service] Health : http://localhost:${PORT}/health`);
  console.log("=====================================");

  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka");
      console.error(error);
    } else {
      console.log("✅ PointRequest-Service enregistré dans Eureka");
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