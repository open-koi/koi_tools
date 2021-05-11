const koi_tools = require("./tools.js");
const tools = new koi_tools();

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
    await tools.nodeLoadWallet(this.walletFile);
    let state = await tools.getContractState();
    this.wallet = await tools.getWalletAddress();

    if (state.stakes[this.wallet] < this.stakeAmount) {
      console.log("stake amount too low", state.stakes[this.wallet]);
      await tools.stake(this.stakeAmount);
    }

    await this.work(this.wallet);
  }

  async work(wallet) {
    let contractState = await tools.getContractState();
    let block = await tools.getBlockheight();
    console.log(wallet, "  is looking for task to join...... ");
    if (this.checkForVote(contractState, block)) {
      await this.searchVote(contractState, wallet);
    }

    if (this.checkProposeSlash(contractState, block)) {
      await tools.proposeSlash();
    }

    if (this.isProposalRanked(contractState, block)) {
      await rankProposal();
    }

    if (this.isRewardDistributed(contractState, block)) {
//       await distribute();
      console.log('distributing rewards')
    }

    await this.work(wallet);
  }

  async searchVote(state, wallet) {
    //console.log(wallet, "  is looking for votes to join...... ");
    // const state = await tools.getContractState();
    const votes = state.votes;
    if (tools.totalVoted < votes.length - 1) {
      let id = tools.totalVoted;
      let voteid = id + 1;
      const arg = {
        voteId: voteid,
        direct: this.direct,
      };
      console.log(voteid);
      let result = await tools.vote(arg);

      console.log(`for ${voteid}VoteId..........,`, result.message);

      await this.searchVote(state, wallet);
    }
  }
  checkForVote(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    if (block < trafficLogs.close - 250) {
      return true;
    }
    return false;
  }

  checkProposeSlash(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;

    if (block > trafficLogs.close - 150 && block < trafficLogs.close - 75) {
      return true;
    }
    return false;
  }

  isProposalRanked(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;

    const currentTrafficLogs = contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
      (trafficlog) => trafficlog.block === trafficLogs.open
    );

    if (
      block > trafficLogs.close - 75 &&
      block < trafficLogs.close &&
      currentTrafficLogs.isRanked === false
    ) {
      return true;
    }
    return false;
  }

  isRewardDistributed(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    const currentTrafficLogs = contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
      (trafficlog) => trafficlog.block === trafficLogs.open
    );

    if (
      block > trafficLogs.close &&
      currentTrafficLogs.isDistributed === false
    ) {
      return true;
    }
    return false;
  }
}

module.exports = node;
