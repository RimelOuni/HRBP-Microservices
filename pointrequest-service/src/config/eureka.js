const { Eureka } = require("eureka-js-client");

const PORT = parseInt(process.env.PORT, 10) || 3015;
const HOST_NAME = process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const eurekaClient = new Eureka({
  instance: {
    app: "POINTREQUEST-SERVICE",
    instanceId: `${HOST_NAME}:pointrequest-service:${PORT}`,
    hostName: HOST_NAME,
    ipAddr: process.env.EUREKA_INSTANCE_IP || "127.0.0.1",
    port: { $: PORT, "@enabled": "true" },
    vipAddress: "pointrequest-service",
    statusPageUrl: `http://localhost:${PORT}/health`,
    healthCheckUrl: `http://localhost:${PORT}/health`,
    homePageUrl: `http://localhost:${PORT}`,
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
  },
  eureka: {
    host: process.env.EUREKA_SERVER_HOST || "localhost",
    port: process.env.EUREKA_SERVER_PORT || 8761,
    servicePath: "/eureka/apps/",
  },
});

module.exports = eurekaClient;