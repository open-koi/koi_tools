"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web = void 0;
const common_1 = require("./common");
const ADDR_BUNDLER_TOP = common_1.ADDR_BUNDLER + "/state/getTopContent/";
class Web extends common_1.Common {
    /**
     * Get top contents of user
     * @returns Array of user contents
     */
    async myContent() {
        //const state = await this.getContractState();
        const state = await common_1.getCacheData(ADDR_BUNDLER_TOP);
        const contents = [];
        state.data
            .filter((item) => item.owner === this.address)
            .forEach((element, i) => {
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
        const topContents = await common_1.getCacheData(path);
        return topContents;
    }
}
exports.Web = Web;
module.exports = { Web };
//# sourceMappingURL=web.js.map