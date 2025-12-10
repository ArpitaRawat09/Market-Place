let redisClient;

if (process.env.NODE_ENV === "test") {
  const resolveOk = async () => "OK";
  const resolveOne = async () => 1;
  const resolveVoid = async () => undefined;

  redisClient = {
    set: resolveOk,
    del: resolveOne,
    expire: resolveOne,
    on: () => undefined,
    quit: resolveVoid,
  };
} else {
  const { Redis } = require("ioredis");

  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  redisClient.on("connect", () => {
    console.log("Connected to Redis");
  });
}

module.exports = redisClient;
