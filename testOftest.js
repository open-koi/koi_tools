const tools       = require('./koi-tools')
//var ktools        = new tools()
const Arweave = require ('arweave/node')
const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
    port: 443
  });

  var wallet1 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";


  var node = new tools();


  start()

  async function start() {

    await node.loadWallet(wallet1);
    await vote();





}



async function vote(){

    let arg = {
        voteId: 0,
      userVote: 'false',
      direct: false
    }

    let result = await node.vote(arg);

    console.log(result);


  



}