const { Eureka } = require("eureka-js-client");

const PORT             = parseInt(process.env.PORT, 10) || 3008;
const EUREKA_HOST      = process.env.EUREKA_HOST || "localhost";
const EUREKA_PORT      = parseInt(process.env.EUREKA_PORT, 10) || 8761;
const INSTANCE_HOST    = process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";
const INSTANCE_IP      = process.env.EUREKA_INSTANCE_IP || "127.0.0.1";
const HOST_NAME = process.env.EUREKA_INSTANCE_HOSTNAME || "localhost";


const eurekaClient = new Eureka({
  instance: {
    app:            "SURVEY-SERVICE",
    instanceId: `${HOST_NAME}:survey-service:${PORT}`,
    hostName: HOST_NAME,
    ipAddr: process.env.EUREKA_INSTANCE_IP || "127.0.0.1",
    port:           { $: PORT, "@enabled": "true" },
    vipAddress:     "survey-service",
    statusPageUrl:  `http://${INSTANCE_HOST}:${PORT}/health`,
    healthCheckUrl: `http://${INSTANCE_HOST}:${PORT}/health`,
    homePageUrl:    `http://${INSTANCE_HOST}:${PORT}`,
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn",
    },
  },
  eureka: {
    host:        EUREKA_HOST,
    port:        EUREKA_PORT,
    servicePath: "/eureka/apps/",
  },
});

module.exports = eurekaClient;