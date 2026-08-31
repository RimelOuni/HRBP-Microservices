const express = require("express");
const cors = require("cors");
const moodRoutes = require("./routes/mood.routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
app.use(express.json());

app.use("/api/moods", moodRoutes);

module.exports = app;