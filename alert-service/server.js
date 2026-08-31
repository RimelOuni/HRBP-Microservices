require("dotenv").config();
const app       = require("./src/app");
const connectDB = require("./src/config/db");
const { startEurekaClient } = require("./src/config/eureka"); // ajuste le chemin

const PORT = process.env.PORT || 3010;

connectDB();

app.listen(PORT, () => {
  console.log(`[alert-service] Port         : ${PORT}`);
  console.log(`[alert-service] Health       : http://localhost:${PORT}/health`);
  console.log(`[alert-service] User-svc     : ${process.env.USER_SERVICE_URL}`);
  console.log(`[alert-service] Point-svc    : ${process.env.POINT_SERVICE_URL}`);
  startEurekaClient();
});