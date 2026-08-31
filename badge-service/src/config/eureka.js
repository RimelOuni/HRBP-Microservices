const Eureka = require("eureka-js-client").Eureka;

const PORT = process.env.PORT || 3011;
const HOST_NAME = process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const client = new Eureka({
  instance: {
    app: "badge-service",
    instanceId: `${HOST_NAME}:badge-service:${PORT}`,
    hostName: HOST_NAME,
    ipAddr: process.env.EUREKA_INSTANCE_IP || "127.0.0.1",
    port: {
      $: PORT,
      "@enabled": "true",
    },
    vipAddress: "badge-service",
    statusPageUrl: `http://localhost:${PORT}/health`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
  },
  eureka: {
    host: process.env.EUREKA_SERVER_HOST || "localhost",
    port: process.env.EUREKA_SERVER_PORT || 8761,
    servicePath: "/eureka/apps/",
    maxRetries: 10,
    requestRetryDelay: 3000,
  },
});

function startEurekaClient() {
  client.start((error) => {
    if (error) {
      console.error("[badge-service] Eureka registration échouée :", error);
    } else {
      console.log("[badge-service] Enregistré auprès de Eureka (discovery-service)");
    }
  });
}

function stopEurekaClient() {
  client.stop(() => {
    console.log("[badge-service] Désenregistré de Eureka");
  });
}

process.on("SIGINT", () => {
  stopEurekaClient();
  process.exit(0);
});

module.exports = { client, startEurekaClient, stopEurekaClient };