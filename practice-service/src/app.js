const express = require("express");
const cors    = require("cors");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200", credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "practice-service", timestamp: new Date().toISOString() })
);

// Routes
app.use("/api/practices", require("./routes/practice.routes"));

// 404
app.use((req, res) =>
  res.status(404).json({ message: `Route non trouvée : ${req.method} ${req.originalUrl}` })
);

// Erreur globale
app.use((err, req, res, next) => {
  console.error("[practice-service] Erreur :", err);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

module.exports = app;
