const { koi_node } = require("../index.js");
require("dotenv").config();

var wallet1 = process.env.WALLET_LOCATION;

console.log("wallet1",wallet1)
const arg1 = {
  wallet: "C:\\Users\\Syed Ghazanfer Anwar\\Desktop\\KOI\\KOI_tasks_Related_WORK\\KOI_tasks_SDK\\arweave-key-zFGpdtH0tpXAvG7PDMhq-ExCR_w7c4PYuwmoRZKmMpA.json",
  qty: 4,
  direct: false, // direct false means, vote through bundler which is feeless
};

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
