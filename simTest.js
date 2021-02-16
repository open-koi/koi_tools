const tools       = require('./koi-tools')
//var ktools        = new tools()
const Arweave = require ('arweave/node')
const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
    port: 443
  });

  var wallet1 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";
  var wallet2 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet2.json";
  var wallet3 = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet3.json";

  var node1 = new tools();

  var node2 = new tools();

  var node3 = new tools();
  
   start()


  async function start () {
   
     
   await node1.loadWallet(wallet1)
    
    await node2.loadWallet(wallet2)
    await node3.loadWallet(wallet3)

    nodes = [];
    nodes.push(node1);
    nodes.push(node2);
    nodes.push(node3);


    await getAddress(nodes)

   while (true){

    checkUpdateAndVote(nodes)

    console.log("all voted,  again?");
   }
   

  }




  async function  getAddress(nodes){

    console.log(nodes);

    for (var i = 0; i < nodes.length; i++){
      
        let address =  await nodes[i].getWalletAddress();
        console.log(address);
    }

}


async function checkUpdateAndVote(nodes) {

    
    
        for (var i = 0; i < nodes.length; i++){
      
            let state =  await nodes[i].getContractState();
             if(state){
                let myVotes = await nodes[i].getMyVotes();
               
                if(myVotes.length < state.votes.length){
                      console.log("ye! I found something to vote ");
                    await nodes[i].vote(state.vote[length-1].id);
                    nodes.remove(nodes[i]);
                }
           
            }
        }

        if( nodes.length != 0){
            checkUpdateAndVote(nodes)
        }
       
      
    
}