const express = require("express");
const cors    = require("cors");

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:4200",
  credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (req, res) =>
  res.json({
    status:    "ok",
    service:   "project-service",
    timestamp: new Date().toISOString(),
  })
);

// Routes — montées avec :practiceId dans le préfixe pour garder la cohérence
// avec le monolithe : /api/practices/:practiceId/projects
app.use("/api/practices/:practiceId/projects", require("./routes/project.routes"));

// 404
app.use((req, res) =>
  res.status(404).json({ message: `Route non trouvée : ${req.method} ${req.originalUrl}` })
);

// Erreur globale
app.use((err, req, res, next) => {
  console.error("[project-service] Erreur :", err);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

module.exports = app;
