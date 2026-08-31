
const { createProxyMiddleware } = require("http-proxy-middleware");

// 4. AVANT la ligne : app.use("/api/practices", practiceRoutes);
//    Ajouter ce bloc :

app.use(
  "/api/practices",
  createProxyMiddleware({
    target:       process.env.PRACTICE_SERVICE_URL || "http://localhost:3005",
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        console.error("[Proxy → practice-service] Erreur :", err.message);
        res.status(502).json({ message: "practice-service indisponible" });
      },
    },
  })
);

// 5. Commenter ou supprimer l'ancienne ligne :
// app.use("/api/practices", practiceRoutes);  ← DÉSACTIVER
