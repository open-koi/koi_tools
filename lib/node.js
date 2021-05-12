const koi_tools = require("./tools.js");
const tools = new koi_tools();
const axios = require("axios");
const { toUpper } = require("lodash");
const prompts = require("prompts");

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
    this.totalVoted = tools.totalVoted;
    this.isProposeSlashed = false;
    this.isRanked = false;
    this.isDistributed = false;
  }

  async run() {
    console.log("entered run node with");
    await tools.nodeLoadWallet(this.walletFile);
    // let state = await tools.getContractState();
    this.wallet = await tools.getWalletAddress();
    console.log(this.wallet);

    // if (state.stakes[this.wallet] < this.stakeAmount) {
    //   console.log("stake amount too low", state.stakes[this.wallet]);
    //   await tools.stake(this.stakeAmount);
    // }

    await this.work(this.wallet);
  }

  async work(wallet) {
    console.log("hiii");
    //let contractState = await tools.getContractState();
    const path = "https://bundler.openkoi.com:8888/state/current/";
    const contractState = await getCacheData(path);
    console.log("contractState");
    let block = await tools.getBlockheight();
    console.log(block);
    console.log(wallet, "  is looking for task to join...... ");
    if (this.checkForVote(contractState.data, block)) {
      await this.searchVote(contractState.data, wallet);
    }

    // if (this.checkProposeSlash(contractState, block)) {
    //   await tools.proposeSlash();
    // }

    if (this.isProposalRanked(contractState.data, block)) {
      await this.rankProposal();
    }

    if (this.isRewardDistributed(contractState.data, block)) {
      await this.distribute();
    }

    await this.work(wallet);
  }

  async checkTxConfirmation(txid, num, task) {
    num += 1;
    console.log(
      "tx is being added to blockchain ......" + num + "%" + " " + task
    );
    try {
      await tools.getTransaction(txid);
      var found = true;
      console.log("transaction found");
    } catch (err) {
      console.log(err.type);
    }
    if (found === true) {
      return true;
    }
    await this.checkTxConfirmation(txid, num, task);
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
      let { message } = await tools.vote(arg);

      console.log(`for ${voteid}VoteId..........,`, message);

      await this.searchVote(state, wallet);
    }
  }
  async proposeSlash() {
    var task = "propose  slashing";
    var num = 0;
    let result = await tools.proposeSlash();
    if (result !== null) {
      await this.checkTxConfirmation(tx, num, task);
      console.log("slash is submited");
      this.isProposeSlashed = true;
    } else {
      console.log("no need to slash, bundler sumbit your vote");
    }
  }

  async rankProposal() {
    var task = "ranking  reward";
    var num = 0;
    let tx = await tools.rankProposal();
    await this.checkTxConfirmation(tx, num, task);
    this.isRanked = true;
  }

  async distribute() {
    var task = "distributing reward";
    var num = 0;
    let tx = await tools.distributeDailyRewards();
    await this.checkTxConfirmation(tx, num, task);
    this.isDistributed = true;
  }

  checkForVote(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    if (block < trafficLogs.close - 250) {
      return true;
    }
    return false;
  }

  checkProposeSlash(contractState, block) {
    let votes = contractState.votes;
    let receipt = tools.receipt;
    let lastReciept = receipt[receipt.length - 1];
    const index = receipt.lenght - 1;
    let lastReciept = receipt[index];
    let voteId = lastReciept.vote.vote.voteId;
    let vote = votes[voteId];
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    if (
      !vote.voted.includes(this.wallet) &&
      block > trafficLogs.close - 150 &&
      block < trafficLogs.close - 75 &&
      !this.isProposeSlashed
    ) {
    }
    // let voteId = lastReciept.vote.vote.voteId;

    // let activeVote = votes[votes.length - 1];
    // let activeVoteId = activeVote.id;
    // let slash = false;
    // if (activeVoteId == voteId) {
    //   slash = true;
    // }

    {
      return true;
    }
    return false;
  }

  isProposalRanked(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;

    const currentTrafficLogs =
      contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
        (trafficlog) => trafficlog.block === trafficLogs.open
      );
    let rank = false;
    if (currentTrafficLogs.isRanked || this.isRanked) {
      rank = true;
    }

    if (block > trafficLogs.close - 75 && block < trafficLogs.close && !rank) {
      return true;
    }

    return false;
  }

  isRewardDistributed(contractState, block) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    const currentTrafficLogs =
      contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
        (trafficlog) => trafficlog.block === trafficLogs.open
      );
    let distribute = false;
    if (currentTrafficLogs.isDistributed || this.isDistributed) {
      distribute = true;
    }
    if (block > trafficLogs.close && !distribute) {
      this.isRanked = false;
      return true;
    }

    return false;
  }
}
async function getCacheData(path) {
  return new Promise(function (resolve, reject) {
    axios
      .get(path)
      .then((res) => {
        resolve(res);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

module.exports = node;

const prompt = () => {
  let response = await prompts({
    type: "text",
    name: "SLASH",
    message:
      "bundler didn't submit your Vote. Type `CONFIRM` to slash the bundler",
  });
};
