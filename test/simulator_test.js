const { koi_node } = require("../index.js");

// var wallet1 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";
var wallet1 = "/Users/makdasebhatu/Documents/my-wallet/Arweave/keywallet.json";

const arg1 = {
  wallet: wallet1,
  qty: 200,
};

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
