require("dotenv").config();
const app       = require("./src/app");
const connectDB = require("./src/config/db");
const { startEurekaClient } = require("./src/config/eureka"); // ajuste le chemin

const PORT = process.env.PORT || 3011;

connectDB();

app.listen(PORT, () => {
  console.log(`[badge-service] Port : ${PORT}`);
  startEurekaClient();
});