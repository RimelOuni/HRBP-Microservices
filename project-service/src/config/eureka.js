const { Eureka } = require("eureka-js-client");

const PORT = parseInt(process.env.PORT, 10) || 3006;

const HOST_NAME =
  process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";

const IP_ADDR =
  process.env.EUREKA_INSTANCE_IP || "127.0.0.1";

const eurekaClient = new Eureka({
  instance: {
    app: "PROJECT-SERVICE",

    instanceId: `${HOST_NAME}:project-service:${PORT}`,

    hostName: HOST_NAME,

    ipAddr: IP_ADDR,

    port: {
      $: PORT,
      "@enabled": "true",
    },

    vipAddress: "project-service",

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
    host:
      process.env.EUREKA_SERVER_HOST || "localhost",

    port:
      parseInt(process.env.EUREKA_SERVER_PORT, 10) || 8761,

    servicePath: "/eureka/apps/",
  },
});

module.exports = eurekaClient;