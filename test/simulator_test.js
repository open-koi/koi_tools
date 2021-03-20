const { koi_node }       = require('../index.js')

 var wallet1 = 'c:/Users/sebha/Desktop/koi/NFT-bridge/src/keywallet.json';
//var wallet1 = "/media/al/files/koi/Arweave/sec2.json"

const arg1 = {
        wallet:wallet1,
        qty:4
      }

var node = new koi_node (arg1);

console.log('node is', node)

node.run()