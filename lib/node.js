const koi_tools = require('./tools.js')
const tools = new koi_tools ();

class node {

    constructor(prop) {
      this.walletFile = prop.wallet;
      this.stakeAmount = prop.qty
      this.wallet = {};
      this.myBookmarks = [];
      this.totalVoted = -1;
    }

    async runNode() {
        console.log('entered run node with')
        await tools.loadWallet(this.walletFile)
        let state = await tools.getContractState();
        let wallet = await  tools.getWalletAddress();

        if(state.stakes[wallet] < this.stakeAmount){
            await this.stake( this.stakeAmount );
        }

        await this.work(wallet);
        
    }


    async work(wallet) {
        console.log(wallet, '  IS LOOKING FOR VOTE......')
        const state = await tools.getContractState();
        const vote = state.votes.find(vo => vo.id === state.numberOfVotes);
        if( (this.totalVoted < state.numberOfVotes) && (vote.active === true) ){
            const arg = {
                voteId: state.numberOfVotes,
                direct: false
            }

            var result = await tools.vote(arg);
            console.log(wallet, " just voted..........", result);

        }

        await this.work(wallet);

    }
}

module.exports = node;