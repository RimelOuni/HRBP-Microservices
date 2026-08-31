require("dotenv").config();
const app       = require("./src/app");
const connectDB = require("./src/config/db");
const { startEurekaClient } = require("./src/config/eureka"); // ajuste le chemin

const PORT = process.env.PORT || 3007;

connectDB();

app.listen(PORT, () => {
  console.log(`[point-service] Port : ${PORT}`);
  startEurekaClient();
});