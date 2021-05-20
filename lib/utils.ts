var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    return result;
  };
const Arweave = require("arweave/node");
const fs = require("jsonfile");
const smartweave = require("smartweave");
const axios = require("axios");
const ArweaveUtils = __importStar(require("arweave/node/lib/utils"));
const _ = require("lodash");
const Datastore = require("nedb-promises");
const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});
/**
 * 
 * @param {Object} payload - 
 * @returns {Boolean} promise
 */
class KouUtils {
    static async  verifySignature(payload:any):Promise<any> {
      const rawSignature = ArweaveUtils.b64UrlToBuffer(payload.signature);
      const dataInString = JSON.stringify(payload.vote);
      const dataIn8Array = ArweaveUtils.stringToBuffer(dataInString);
      const valid = await arweave.crypto.verify(
        payload.owner,
        dataIn8Array,
        rawSignature
      );
      return valid;

    }
}