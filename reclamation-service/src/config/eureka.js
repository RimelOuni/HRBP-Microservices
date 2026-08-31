const { Eureka } = require("eureka-js-client");

const PORT = parseInt(process.env.PORT, 10) || 3016;
const HOST_NAME = process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const eurekaClient = new Eureka({
  instance: {
    instanceId: `${HOST_NAME}:reclamation-service:${PORT}`,
    hostName: HOST_NAME,
    ipAddr: process.env.EUREKA_INSTANCE_IP || "127.0.0.1",
    port: { $: PORT, "@enabled": "true" },
    vipAddress: "reclamation-service",
    statusPageUrl: `http://localhost:${PORT}/health`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    homePageUrl: `http://localhost:${PORT}`,
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
  },
  eureka: {
    host: "localhost",
    port: 8761,
    servicePath: "/eureka/apps/",
  },
});

module.exports = eurekaClient;