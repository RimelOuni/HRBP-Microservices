const express = require("express");
const cors = require("cors");
const pointRequestRoutes = require("./routes/pointrequest.routes");

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }));
app.use(express.json());

app.use("/api/pointrequests", pointRequestRoutes);

module.exports = app;