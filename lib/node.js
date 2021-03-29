const koi_tools = require("./tools.js");
const tools = new koi_tools();
//const votedFile = require("../repo/fileCreator.js");

/*
Koi Node Operation: {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs (or other task data)
  4. submit vote to bundler server
  5. verify vote was added to arweave (after 24 hrs) 
}
*/

class node {
  constructor(prop) {
    console.log(prop);
    this.walletFile = prop.wallet;
    this.stakeAmount = prop.qty;
    this.direct = prop.direct;
    this.wallet = {};
    this.myBookmarks = [];
    this.totalVoted = -1;
  }

  async run() {
    console.log("entered run node with");
    await tools.loadWallet(this.walletFile);
    let state = await tools.getContractState();
    this.wallet = await tools.getWalletAddress();

    if (state.stakes[this.wallet] < this.stakeAmount) {
      console.log("stake amount too low", state.stakes[this.wallet]);
      await tools.stake(this.stakeAmount);
    }

    await this.work(this.wallet);
  }

  async work(wallet) {
    console.log(wallet, "  is looking for votes to join... ");

    await this.searchVote();

    await this.checkProposeSlash();

    await this.work(wallet);
  }

  async searchVote() {
    const state = await tools.getContractState();
    const votes = state.votes;
    if (tools.totalVoted < votes.length - 1) {
      let id = tools.totalVoted;
      let voteid = id + 1;
      const arg = {
        voteId: voteid,
        direct: this.direct,
      };
      console.log(arg.voteId);
      let result = await tools.vote(arg);
      console.log(" just voted..........", result);
      await this.searchVote();
    }
  }

  async checkProposeSlash() {
    const state = await tools.getContractState();
    const trafficLogs = state.stateUpdate.trafficLogs;

    const currentBlock = await tools.getBlockheight();

    if (
      !(
        trafficLogs.close - 100 > currentBlock &&
        currentBlock < trafficLogs.close
      )
    ) {
      await tools.proposeSlash();
    }
  }
}

module.exports = node;
