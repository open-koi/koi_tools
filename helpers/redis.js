const redis = require("redis");
const client = redis.createClient({
  host: process.env.REDIS_IP, // The redis's server ip 
  port: process.env.REDIS_PORT,
  password:process.env.REDIS_PASSWORD
});
 
client.on("error", function(error) {
  console.error(error);
});
 
client.on('connect', function() {
  console.log('connected to redis!!');
  });
module.exports=client