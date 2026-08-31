const express = require("express");
const cors = require("cors");
const reclamationRoutes = require("./routes/reclamation.routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
app.use(express.json());

app.use("/api/reclamations", reclamationRoutes);

module.exports = app;