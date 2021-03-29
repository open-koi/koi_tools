const { koi_node } = require("../index.js");
require("dotenv").config();

<<<<<<< HEAD
var wallet1 = "/Users/makdasebhatu/Documents/my-wallet/Arweave/keywallet.json";

const arg1 = {
  wallet: wallet1,
  qty: 4,
  direct: false, // direct false means, vote through bundler which is feeless
=======
var wallet1 = process.env.WALLET_LOCATION;

const arg1 = {
  wallet: wallet1,
  qty: 2,
direct: true,   // direct false means, vote through bundler which is feeless 
>>>>>>> 69a0a414a84728220acac7867495e45d97307c6c
};

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
