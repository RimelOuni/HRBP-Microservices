const express = require("express");
const cors = require("cors");
const satisfactionRoutes = require("./routes/satisfaction.routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
app.use(express.json());

app.use("/api/satisfactions", satisfactionRoutes);

module.exports = app;