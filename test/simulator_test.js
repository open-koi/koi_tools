const node       = require('../lib/node.js')

// var wallet1 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";
var wallet1 = "/media/al/files/koi/Arweave/sec2.json"

async function start() {
  const arg1 = {
          wallet:wallet1,
          qty:20
        }

  var koi_node = new node (arg1);

  console.log('node is', koi_node)
  
  koi_node.runNode()

}

start()