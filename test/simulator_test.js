const { koi_node } = require("../index.js");
require("dotenv").config();

var wallet1 = 'some'

const arg1 = {
  wallet: wallet1,
  qty: 4,
<<<<<<< HEAD


  direct: false,
=======
  direct: false,   // direct false means, vote through bundler which is feeless 
>>>>>>> 6d3ae3f5b0c7a74dfe9eaa8bef0e36499b7284b7
};

var node = new koi_node(arg1);

console.log("node is", node);

node.run();
