require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { Eureka } = require("eureka-js-client");

const PORT = parseInt(process.env.PORT, 10) || 3006;

const HOST_NAME =
  process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const IP_ADDR =
  process.env.EUREKA_INSTANCE_IP || "127.0.0.1";

// ===============================
// Connexion MongoDB
// ===============================
connectDB();

// ===============================
// Configuration Eureka
// ===============================
const eurekaClient = new Eureka({
  instance: {
    app: "PROJECT-SERVICE",

    // Important : affichage unique dans Eureka
    instanceId: `${HOST_NAME}:project-service:${PORT}`,

    hostName: HOST_NAME,

    ipAddr: IP_ADDR,

    port: {
      $: PORT,
      "@enabled": "true",
    },

    vipAddress: "project-service",

    statusPageUrl: `http://${HOST_NAME}:${PORT}/health`,

    healthCheckUrl: `http://${HOST_NAME}:${PORT}/health`,

    homePageUrl: `http://${HOST_NAME}:${PORT}`,

    dataCenterInfo: {
      "@class":
        "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",

      name: "MyOwn",
    },
  },

  eureka: {
    host:
      process.env.EUREKA_SERVER_HOST || "localhost",

    port:
      parseInt(process.env.EUREKA_SERVER_PORT, 10) || 8761,

    servicePath: "/eureka/apps/",
  },
});

// ===============================
// Endpoint Health
// ===============================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP",
    service: "project-service",
    timestamp: new Date().toISOString(),
  });
});

// ===============================
// Démarrage du serveur
// ===============================
app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[project-service] Port : ${PORT}`);
  console.log(
    `[project-service] Health : http://${HOST_NAME}:${PORT}/health`
  );
  console.log("=====================================");

  // Enregistrement dans Eureka
  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka");
      console.error(error);
    } else {
      console.log("✅ Project-Service enregistré dans Eureka");
    }
  });
});

// ===============================
// Arrêt propre
// ===============================
const shutdown = () => {
  console.log("\n🛑 Arrêt du PROJECT-SERVICE...");

  eurekaClient.stop(() => {
    console.log("🛑 Déconnecté de Eureka");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);