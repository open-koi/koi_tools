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

    async run () {
        console.log('entered run node with')
        await tools.loadWallet(this.walletFile)
        let state = await tools.getContractState();
        this.wallet = await  tools.getWalletAddress();

        if(state.stakes[this.wallet] < this.stakeAmount){
            console.log('stake amount too low', state.stakes[this.wallet])
            await tools.stake( this.stakeAmount );
        }

        await this.work(this.wallet);
        
    }


    async work(wallet) {
        console.log(wallet, '  is looking for votes to join... ')
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