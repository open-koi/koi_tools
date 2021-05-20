import { Common, ADDR_BUNDLER, KOI_CONTRACT, getCacheData } from "./common";
import { JWKInterface } from "arweave/node/lib/wallet";
import { smartweave } from "smartweave";

const ADDR_BUNDLER_TOP = ADDR_BUNDLER + "/state/getTopContent/";
const ADDR_BUNDLER_STATE = ADDR_BUNDLER + "/state/current/";

export class Web extends Common {
  /**
   * Interact with contract to register data
   * @param txId It has batchFile/value(string) and stakeamount/value(int) as properties
   * @param owner
   * @param arWallet
   * @param arweaveInst Arweave client instance
   * @returns Transaction ID
   */
  registerData(
    txId: any, // Maybe string?
    owner: any, // Maybe string?
    arWallet: JWKInterface | "use_wallet" = "use_wallet",
    arweaveInst: any
  ): Promise<string> {
    const input = {
      function: "registerData",
      txId: txId,
      owner: owner
    };

    return smartweave.interactWrite(arweaveInst, arWallet, KOI_CONTRACT, input);
  }

  /**
   * returns the top contents registered in Koi in array
   * @returns
   */
  async retrieveTopContent(): Promise<any> {
    const allContents = await this._retrieveAllContent();
    allContents.sort(function (a: any, b: any) {
      return b.totalViews - a.totalViews;
    });
    return allContents;
  }

  /**
   *
   * @param contentTxId TxId of the content
   * @param state
   * @returns An object with {totaltViews, totalReward, 24hrsViews}
   */
  async contentView(contentTxId: any, state: any): Promise<any> {
    // const state = await this.getContractState();
    // const path = "https://bundler.openkoi.com/state/current/";
    const rewardReport = state.data.stateUpdate.trafficLogs.rewardReport;

    try {
      const nftState = await this.readNftState(contentTxId);
      const contentViews = {
        ...nftState,
        totalViews: 0,
        totalReward: 0,
        twentyFourHrViews: 0,
        txIdContent: contentTxId
      };

      rewardReport.forEach((ele: any) => {
        const logSummary = ele.logsSummary;

        for (const txId in logSummary) {
          if (txId == contentTxId) {
            if (rewardReport.indexOf(ele) == rewardReport.length - 1) {
              contentViews.twentyFourHrViews = logSummary[contentTxId];
            }

            const rewardPerAttention = ele.rewardPerAttention;
            contentViews.totalViews += logSummary[contentTxId];
            const rewardPerLog = logSummary[contentTxId] * rewardPerAttention;
            contentViews.totalReward += rewardPerLog;
          }
        }
      });
      return contentViews;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get top contents of user
   * @returns Array of user contents
   */
  async myContent(): Promise<[any]> {
    //const state = await this.getContractState();
    const state: any = await getCacheData(ADDR_BUNDLER_STATE);
    const contents: any = [];

    state.data
      .filter((item: any) => item.owner === this.address)
      .forEach((element: any, i: number) => {
        // let str_created_at = element.createdAt || "1609500000";
        // let created_at = Number(str_created_at) * 1000;
        // element.created_at = created_at;
        element.order = i + 1;
        contents.push(element);
      });

    /*
    const registerRecords = state.data.registeredRecord;
    for (const txId in registerRecords) {
      if (registerRecords[txId] == this.address) {
        const nftInfo: any = await this.contentView(txId, state);
        if (nftInfo !== null) {
          contents.push(nftInfo);
        }
      }
    }
    */

    return contents;
  }

  /**
   *
   * @returns
   */
  async getTopContent() {
    const path = ADDR_BUNDLER_TOP;
    const topContents = await getCacheData(path);
    return topContents;
  }

  // Private functions

  /**
   *
   * @returns
   */
  private async _retrieveAllContent(): Promise<any> {
    const state = await this.getContractState();
    const registerRecords = state.registeredRecord;
    const txIdArr = Object.keys(registerRecords);
    const contentViewPromises = txIdArr.map((txId) =>
      this.contentView(txId, state)
    );
    // Required any to convert PromiseSettleResult to PromiseFulfilledResult<any>
    const contents = await Promise.all(contentViewPromises);
    const result = contents.filter((res) => res.value !== null);
    const clean = result.map((res) => res.value);

    return clean;
  }
}

module.exports = { Web };
