const { koi_node } = require("../index.js");
require("dotenv").config();


//var wallet1 = "/Users/makdasebhatu/Documents/my-wallet/Arweave/keywallet.json";

const arg1 = {
  wallet: wallet1,
  qty: 4,
  direct: false, // direct false means, vote through bundler which is feeless
};

var wallet1 = process.env.WALLET_LOCATION;

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
