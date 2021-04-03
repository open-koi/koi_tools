const Arweave = require("arweave/node");
const smartweave = require("smartweave");
const koi_tools = require("../lib/tools.js");
const ktools = new koi_tools();
const wallet1 = "C:\\Users\\Syed Ghazanfer Anwar\\Desktop\\KOI\\KOI_tasks_Related_WORK\\KOI_tasks_SmartContract\\arweave-key-zFGpdtH0tpXAvG7PDMhq-ExCR_w7c4PYuwmoRZKmMpA.json";
const arweaveNode = Arweave.init({
    host: "arweave.net",
    protocol: "https",
    port: 443,
});

setTimeout(function() {
    run ()
}, 1500); // allow time for the arweave node to initialize?
// run ();

async function run () {

    await ktools.loadWallet(wallet1);
    //const currentSate = await ktools.getContractState();
    const koi_contract = "BYRf00nIE4pGkJ8GyUY2PIJ1rBtxFPoWIu-0dd8iukg";
    const wallet = ktools.wallet;

    console.log(ktools.wallet);

    // let input = {
    //     "function": "vote",
    //     "userVote"   : false,
    //     "voteId" : 3
    // }
    var input = {
        function: "stake",
        qty: 4,
      };

    try {
        console.log('about to run dry vote')
        // smartweave.interactWriteDryRun(action)
        var response = await smartweave.interactWriteDryRun(
            arweaveNode,
            wallet,
            koi_contract,
            input,
            
        )
        console.log('ran dry vote', response)
        var response = await smartweave.interactWriteDryRun(
            arweaveNode,
            wallet,
            koi_contract,
            input,
            response.state
            
        )
        console.log('222ran dry vote', response)
    
    } catch (err) {
        console.log('got err', err)
    }
    
    
    
}
//async function interactWriteDryRun(arweave: Arweave, wallet: JWKInterface, contractId: string, input: any, tags: { name: string; value: string }[] = [], target: string = '', winstonQty: string = ''): Promise<ContractInteractionResult>
