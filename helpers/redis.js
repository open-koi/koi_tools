const redis = require("redis");
require("dotenv").config();
let client = null;
if (!process.env.REDIS_IP || !process.env.REDIS_PORT) {
  throw Error("CANNOT READ REDIS IP OR PORT FROM ENV");
} else {
  client = redis.createClient({
    host: process.env.REDIS_IP,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
  });

  client.on("error", function (error) {
    console.log("hiiiiii");
    console.error(error);
  });

  client.on("connect", function () {
    console.log("connected to redis!!");
  });
}
module.exports = client;
