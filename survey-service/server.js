require("dotenv").config();

const app           = require("./src/app");
const connectDB     = require("./src/config/db");
const eurekaClient  = require("./src/config/eureka");

const PORT           = parseInt(process.env.PORT, 10) || 3008;
const EUREKA_ENABLED = process.env.EUREKA_ENABLED !== "false"; // true par défaut

connectDB();

// ⚠️ Route /health déjà définie dans src/app.js — on ne la redéclare pas ici,
// la seconde définition était du code mort (Express garde le premier handler enregistré).

app.listen(PORT, () => {
  console.log("=====================================");
  console.log(`[survey-service] Port : ${PORT}`);
  console.log(`[survey-service] Health : http://localhost:${PORT}/health`);
  console.log("=====================================");

  if (!EUREKA_ENABLED) {
    console.log("ℹ️  Eureka désactivé (EUREKA_ENABLED=false) — pas d'enregistrement.");
    return;
  }

  eurekaClient.start((error) => {
    if (error) {
      console.error("❌ Impossible de s'enregistrer dans Eureka :", error.message);
      console.error("   → le service continue de fonctionner sans service discovery.");
    } else {
      console.log("✅ Survey-Service enregistré dans Eureka");
    }
  });
});

function shutdown() {
  if (!EUREKA_ENABLED) return process.exit();
  eurekaClient.stop(() => {
    console.log("🛑 Déconnecté de Eureka");
    process.exit();
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);