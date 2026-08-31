const { Eureka } = require("eureka-js-client");

const PORT = parseInt(process.env.PORT, 10) || 3005;

const HOST_NAME =
  process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const IP_ADDR =
  process.env.EUREKA_INSTANCE_IP || "127.0.0.1";

const EUREKA_HOST =
  process.env.EUREKA_SERVER_HOST || "localhost";

const EUREKA_PORT =
  parseInt(process.env.EUREKA_SERVER_PORT, 10) || 8761;

const eurekaClient = new Eureka({
  instance: {
    app: "PRACTICE-SERVICE",

    instanceId: `${HOST_NAME}:practice-service:${PORT}`,

    hostName: HOST_NAME,

    ipAddr: IP_ADDR,

    port: {
      $: PORT,
      "@enabled": "true",
    },

    vipAddress: "practice-service",

    statusPageUrl: `http://${HOST_NAME}:${PORT}/health`,

    healthCheckUrl: `http://${HOST_NAME}:${PORT}/health`,

    homePageUrl: `http://${HOST_NAME}:${PORT}`,

    dataCenterInfo: {
      "@class":
        "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",

      name: "MyOwn",
    },
  },

  eureka: {
    host: EUREKA_HOST,

    port: EUREKA_PORT,

    servicePath: "/eureka/apps/",
  },
});

module.exports = eurekaClient;