import { Common, ADDR_BUNDLER, getCacheData } from "./common";

const ADDR_BUNDLER_TOP = ADDR_BUNDLER + "/state/getTopContent/";

export class Web extends Common {
  /**
   * Get top contents of user
   * @returns Array of user contents
   */
  async myContent(): Promise<[any]> {
    //const state = await this.getContractState();
    const state: any = await getCacheData(ADDR_BUNDLER_TOP);
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
}

module.exports = { Web };
