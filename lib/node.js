const koi_tools = require("./tools.js");
const tools = new koi_tools();

class node {
  constructor(prop) {
    this.walletFile = prop.wallet;
    this.stakeAmount = prop.qty;
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
    if (tools.totalVoted > votes.length - 1 && votes.length !== 0) {
      let id = tools.totalVoted;
      const arg = {
        voteId: id++,
        direct: false,
      };
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
