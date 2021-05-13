import { Koi as KoiTools, BasicTx } from "./tools";
const tools = new KoiTools();

/*
Koi Node Operation: {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs (or other task data)
  4. submit vote to bundler server
  5. verify vote was added to arweave (after 24 hrs) 
}
*/

export class Node {
  walletFile;
  stakeAmount;
  direct;
  wallet: any;
  myBookmarks = [];
  totalVoted = -1;

  /**
   *
   * @param prop
   */
  constructor(prop: any) {
    console.log(prop);
    this.walletFile = prop.wallet;
    this.stakeAmount = prop.qty;
    this.direct = prop.direct;
  }

  /**
   *
   */
  async run(): Promise<void> {
    console.log("entered run node with");
    await tools.nodeLoadWallet(this.walletFile);
    const state = await tools.getContractState();
    this.wallet = await tools.getWalletAddress();

    if (state.stakes[this.wallet] < this.stakeAmount) {
      console.log("stake amount too low", state.stakes[this.wallet]);
      await tools.transact(BasicTx.Stake, this.stakeAmount);
    }

    for (;;) await this.work(this.wallet);
  }

  /**
   *
   * @param wallet
   */
  async work(wallet: any): Promise<void> {
    const contractState = await tools.getContractState();
    const block = await tools.getBlockHeight();
    console.log(wallet, "  is looking for task to join...... ");
    if (this.checkForVote(contractState, block)) {
      await this.searchVote(contractState, wallet);
    }

    if (this.checkProposeSlash(contractState, block)) {
      await tools.proposeSlash();
    }

    if (this.isProposalRanked(contractState, block)) {
      await tools.rankProposal();
    }

    if (this.isRewardDistributed(contractState, block)) {
      // await distribute(); // Function does not exist?
    }
  }

  /**
   *
   * @param state
   * @param wallet
   */
  async searchVote(state: any, wallet: any) {
    //console.log(wallet, "  is looking for votes to join...... ");
    // const state = await tools.getContractState();
    const votes = state.votes;
    if (tools.totalVoted < votes.length - 1) {
      const id = tools.totalVoted;
      const voteId = (id + 1).toString();
      const arg = {
        voteId,
        direct: this.direct
      };
      console.log(voteId);
      const result = await tools.vote(arg);

      console.log(`for ${voteId}VoteId..........,`, result.message);

      await this.searchVote(state, wallet);
    }
  }

  /**
   *
   * @param contractState
   * @param block
   * @returns
   */
  checkForVote(contractState: any, block: any) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    if (block < trafficLogs.close - 250) {
      return true;
    }
    return false;
  }

  /**
   *
   * @param contractState
   * @param block
   * @returns
   */
  checkProposeSlash(contractState: any, block: any) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;

    if (block > trafficLogs.close - 150 && block < trafficLogs.close - 75) {
      return true;
    }
    return false;
  }

  /**
   *
   * @param contractState
   * @param block
   * @returns
   */
  isProposalRanked(contractState: any, block: any) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;

    const currentTrafficLogs = contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
      (trafficLog: any) => trafficLog.block === trafficLogs.open
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

  /**
   *
   * @param contractState
   * @param block
   * @returns
   */
  isRewardDistributed(contractState: any, block: any) {
    const trafficLogs = contractState.stateUpdate.trafficLogs;
    const currentTrafficLogs = contractState.stateUpdate.trafficLogs.dailyTrafficLog.find(
      (trafficLog: any) => trafficLog.block === trafficLogs.open
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
