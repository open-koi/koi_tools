const tools       = require('./koi-tools')
//var ktools        = new tools()
//const Arweave = require ('arweave/node')
/*
const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
    port: 443
  });
  */

  var wallet1 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";


  var node = new tools();


  start()

  async function start() {
    const arg1 = {
            wallet:wallet1,
            qty:20
            }

    await node.runNode(arg1);
   
}





