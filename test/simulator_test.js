const { koi_node } = require("../index.js");
require("dotenv").config();

var wallet1 = process.env.WALLET_LOCATION;

const arg1 = {
  wallet: wallet1,
  qty: 4,
  direct: false,
};

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
