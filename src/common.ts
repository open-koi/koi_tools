import axios, { AxiosResponse } from "axios";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as arweaveUtils from "arweave/node/lib/utils";
import Transaction from "arweave/node/lib/transaction";
import { smartweave } from "smartweave";
import { Query } from "@kyve/query";

//@ts-ignore // Needed to allow implicit any here
import { generateKeyPair, getKeyPairFromMnemonic } from "human-crypto-keys";
//@ts-ignore
import { pem2jwk } from "pem-jwk";

export interface BundlerPayload {
  data?: any;
  signature?: string; // Data signed with private key
  owner?: string; // Public modulus, can be used to verifiably derive address
  senderAddress?: string; //@deprecated // Use owner instead
  vote?: Vote; //@deprecated // Use data instead
}

export interface Vote {
  voteId: number;
  direct?: string;
}

export interface RegistrationData {
  url: string;
  timestamp: number;
}

const URL_ARWEAVE_INFO = "https://arweave.net/info";
const URL_ARWEAVE_GQL = "https://arweave.net/graphql";

const BLOCK_TEMPLATE = `
  pageInfo {
    hasNextPage
  }
  edges {
    cursor
    node {
      id anchor signature recipient
      owner { address key }
      fee { winston ar }
      quantity { winston ar }
      data { size type }
      tags { name value }
      block { id timestamp height previous }
      parent { id }
    }
  }`;

export const arweave = Arweave.init({
  host: "gateway.koi.rocks",
  protocol: "https",
  port: 443
});

export const BUNDLER_NODES = "/nodes";

/**
 * Tools for interacting with the koi network
 */
export class Common {
  wallet?: JWKInterface;
  mnemonic?: string;
  address?: string;
  contractId: string;
  bundlerUrl: string;

  constructor(
    bundlerUrl = "https://bundler.openkoi.com:8888",
    contractId = "cETTyJQYxJLVQ6nC3VxzsZf1x2-6TW2LFkGZa91gUWc"
  ) {
    this.bundlerUrl = bundlerUrl;
    this.contractId = contractId;
    console.log("Initialized a Koi Node with smart contract:", this.contractId);
  }

  /**
   * Generates wallet optionally with a mnemonic phrase
   * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
   */
  async generateWallet(use_mnemonic = false): Promise<Error | true> {
    let key: JWKInterface, mnemonic: string | undefined;
    if (use_mnemonic === true) {
      mnemonic = await this._generateMnemonic();
      key = await this._getKeyFromMnemonic(mnemonic);
    } else key = await arweave.wallets.generate();

    if (!key) throw Error("failed to create wallet");

    this.mnemonic = mnemonic;
    this.wallet = key;
    await this.getWalletAddress();
    return true;
  }

  /**
   * Loads arweave wallet
   * @param source object to load from, JSON or JWK, or mnemonic key
   */
  async loadWallet(source: any): Promise<JWKInterface> {
    switch (typeof source) {
      case "string":
        this.wallet = await this._getKeyFromMnemonic(source);
        break;
      default:
        this.wallet = source as JWKInterface;
    }

    await this.getWalletAddress();
    return this.wallet;
  }

  /**
   * Manually set wallet address
   * @param walletAddress Address as a string
   * @returns Wallet address
   */
  setWallet(walletAddress: string): string {
    if (!this.address) this.address = walletAddress;
    return this.address;
  }

  /**
   * Uses koi wallet to get the address
   * @returns Wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (typeof this.address !== "string")
      this.address = await arweave.wallets.jwkToAddress(this.wallet);
    return this.address;
  }

  /**
   * Get and set arweave balance
   * @returns Balance as a string if wallet exists, else undefined
   */
  async getWalletBalance(): Promise<number> {
    if (!this.address) return 0;
    const winston = await arweave.wallets.getBalance(this.address);
    const ar = arweave.ar.winstonToAr(winston);
    return parseFloat(ar);
  }

  /**
   * Gets koi balance from cache
   * @returns Balance as a number
   */
  async getKoiBalance(): Promise<number> {
    const state = await this.getContractState();
    if (this.address !== undefined && this.address in state.balances)
      return state.balances[this.address];
    return 0;
  }

  /**
   * @returns Current KOI system state
   */
  getContractState(): Promise<any> {
    return this._readContract();
  }

  /**
   * Get contract state
   * @param id Transaction ID
   * @returns State object
   */
  async getTransaction(id: string): Promise<Transaction> {
    return arweave.transactions.get(id);
  }

  /**
   * Get block height
   * @returns Block height maybe number
   */
  async getBlockHeight(): Promise<any> {
    const info = await getArweaveNetInfo();
    return info.data.height;
  }

  /**
   *
   * @param txId
   * @returns
   */
  async readNftState(txId: string): Promise<any> {
    return smartweave.readContract(arweave, txId);
  }

  /**
   * Interact with contract to stake
   * @param qty Quantity to stake
   * @returns Transaction ID
   */
  stake(qty: number): Promise<string> {
    if (!Number.isInteger(qty))
      throw Error('Invalid value for "qty". Must be an integer');
    const input = {
      function: "stake",
      qty: qty
    };

    return this._interactWrite(input);
  }

  /**
   * Interact with contract to withdraw
   * @param qty Quantity to transfer
   * @returns Transaction ID
   */
  withdraw(qty: number): Promise<string> {
    if (!Number.isInteger(qty))
      throw Error('Invalid value for "qty". Must be an integer');
    const input = {
      function: "withdraw",
      qty: qty
    };

    return this._interactWrite(input);
  }

  /**
   * Interact with contract to transfer koi
   * @param qty Quantity to transfer
   * @param target Receiver address
   * @returns Transaction ID
   */
  async transfer(qty: number, target: string, token: string): Promise<string> {
    const input = {
      function: "transfer",
      qty: qty,
      target: target
    };
    switch (token) {
      case "AR": {
        const transaction = await arweave.createTransaction(
          { target: target, quantity: arweave.ar.arToWinston(qty.toString()) },
          this.wallet
        );
        await arweave.transactions.sign(transaction, this.wallet);
        await arweave.transactions.post(transaction);
        return transaction.id;
      }
      case "KOI": {
        const txid = await this._interactWrite(input);
        return txid;
      }

      default: {
        throw Error("token or coin ticker doesn't exist");
      }
    }
  }

  /**
   * Mint koi
   * @param arg object arg.targetAddress(receiver address) and arg.qty(amount to mint)
   * @returns Transaction ID
   */
  mint(arg: any): Promise<string> {
    const input = {
      function: "mint",
      qty: arg.qty,
      target: arg.targetAddress
    };

    return this._interactWrite(input);
  }

  /**
   * Interact with contract to register data
   * @param txId It has batchFile/value(string) and stake amount/value(int) as properties
   * @param ownerId String container the owner ID
   * @returns Transaction ID
   */
  registerData(txId: string, ownerId = ""): Promise<string> {
    const input = {
      function: "registerData",
      txId: txId,
      owner: ownerId
    };

    return this._interactWrite(input);
  }

  /**
    * sign transaction
    * @param tx It is transaction
    
    * @returns signed Transaction
    */
  async signTransaction(tx: Transaction): Promise<any> {
    try {
      //const wallet = this.wallet;
      // Now we sign the transaction
      await arweave.transactions.sign(tx, this.wallet);
      // After is signed, we send the transaction
      //await exports.arweave.transactions.post(transaction);
      return tx;
    } catch (err) {
      return null;
    }
  }

  /**
   * Get transaction data from Arweave
   * @param txId Transaction ID
   * @returns Transaction
   */
  nftTransactionData(txId: string): Promise<Transaction> {
    return arweave.transactions.get(txId);
  }

  /**
   * Sign payload
   * @param payload Payload to sign
   * @returns Signed payload with signature
   */

  async signPayload(payload: BundlerPayload): Promise<BundlerPayload | null> {
    if (this.wallet === undefined) return null;
    const data = payload.data || payload.vote || null;
    const jwk = this.wallet;
    const publicModulus = jwk.n;
    const dataInString = JSON.stringify(data);
    const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
    const rawSignature = await arweave.crypto.sign(jwk, dataIn8Array);
    payload.signature = arweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }

  /**
   * Verify signed payload
   * @param payload
   * @returns Verification result
   */
  async verifySignature(payload: any): Promise<boolean> {
    const data = payload.data || payload.vote || null;
    const rawSignature = arweaveUtils.b64UrlToBuffer(payload.signature);
    const dataInString = JSON.stringify(data);
    const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
    return await arweave.crypto.verify(
      payload.owner,
      dataIn8Array,
      rawSignature
    );
  }

  /**
   * posts data on arweave.
   * @param data
   * @returns Transaction ID
   */
  async postData(data: any): Promise<string | null> {
    // TODO: define data interface
    const wallet = this.wallet;
    const transaction = await arweave.createTransaction(
      {
        data: Buffer.from(JSON.stringify(data, null, 2), "utf8")
      },
      wallet
    );

    // Now we sign the transaction
    await arweave.transactions.sign(transaction, wallet);
    const txId = transaction.id;

    // After is signed, we send the transaction
    const response = await arweave.transactions.post(transaction);

    if (response.status === 200) return txId;

    return null;
  }

  /**
   * Gets all the transactions where the wallet is the owner
   * @param wallet Wallet address as a string
   * @param count The number of results to return
   * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
   * @returns Object with transaction IDs as keys, and transaction data strings as values
   */
  getOwnedTxs(wallet: string, count?: number, cursorId?: string): Promise<any> {
    const countStr = count !== undefined ? `, first: ${count}` : "";
    const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
    const query = `
      query {
        transactions(owners:["${wallet}"]${countStr}${afterStr}) {
          ${BLOCK_TEMPLATE}
        }
      }`;
    const request = JSON.stringify({ query });
    return this.gql(request);
  }

  /**
   * Gets all the transactions where the wallet is the recipient
   * @param wallet Wallet address as a string
   * @param count The number of results to return
   * @param cursorId Cursor ID after which to query results, from data.transactions.edges[n].cursor
   * @returns Object with transaction IDs as keys, and transaction data strings as values
   */
  getRecipientTxs(
    wallet: string,
    count?: number,
    cursorId?: string
  ): Promise<any> {
    const countStr = count !== undefined ? `, first: ${count}` : "";
    const afterStr = cursorId !== undefined ? `, after: "${cursorId}"` : "";
    const query = `
      query {
        transactions(recipients:["${wallet}"]${countStr}${afterStr}) {
          ${BLOCK_TEMPLATE}
        }
      }`;
    const request = JSON.stringify({ query });
    return this.gql(request);
  }

  /**
   *
   * @param contentTxId TxId of the content
   * @param state
   * @returns An object with {totaltViews, totalReward, 24hrsViews}
   */
  async contentView(contentTxId: any, state: any): Promise<any> {
    const rewardReport = state.stateUpdate.trafficLogs.rewardReport;

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
   * Get Koi rewards earned from an NFT
   * @param txId The transaction id to process
   * @returns Koi rewards earned or null if the transaction is not a valid Koi NFT
   */
  async getNftReward(txId: string): Promise<number | null> {
    const state = await this.getContractState();
    if (!(txId in state.registeredRecord)) return null;
    const nft = await this.contentView(txId, state);
    return nft.totalReward;
  }

  /**
   *
   * @param request
   * @returns
   */
  async gql(request: string): Promise<any> {
    const { data } = await axios.post(URL_ARWEAVE_GQL, request, {
      headers: { "content-type": "application/json" }
    });
    return data;
  }

  /**
   * Gets an array of service nodes
   * @param url URL of the service node to retrieve the array from a known service node
   * @returns Set
   */
  async getNodes(
    url: string = this.bundlerUrl
  ): Promise<Array<BundlerPayload>> {
    const res: any = await getCacheData(url + BUNDLER_NODES);
    try {
      return JSON.parse(res.data);
    } catch (_e) {
      return [];
    }
  }

  // Protected functions

  /**
   * Writes to contract
   * @param input Passes to smartweave write function, in order to execute a contract function
   * @returns Transaction ID
   */
  protected _interactWrite(input: any): Promise<string> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return smartweave.interactWrite(arweave, wallet, this.contractId, input);
  }

  /**
   * Read contract latest state
   * @returns Contract
   */
  protected async _readContract(): Promise<any> {
    // return smartweave.readContract(arweave, this.contractId);
    const poolID = 4;
    const query = new Query(poolID);
    // finding latest transactions
    try {
      const snapshotArray = await query.limit(1).find();
      if (snapshotArray && snapshotArray.length > 0)
        return JSON.parse(snapshotArray[0]).state;
      else console.error("NOTHING RETURNED FROM KYVE");
    } catch (e) {
      console.error("ERROR RETRIEVING FROM KYVE", e);
    }
    return smartweave.readContract(arweave, this.contractId);
  }

  // Private functions

  /**
   * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
   * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
   */
  private async _generateMnemonic(): Promise<string> {
    const keys = await generateKeyPair(
      { id: "rsa", modulusLength: 4096 },
      { privateKeyFormat: "pkcs1-pem" }
    );
    return keys.mnemonic;
  }

  /**
   * Generates a JWK object representation of an Arweave key
   * @param mnemonic - a 12 word mnemonic represented as a string
   * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
   */
  private async _getKeyFromMnemonic(mnemonic: string): Promise<JWKInterface> {
    const keyPair = await getKeyPairFromMnemonic(
      mnemonic,
      { id: "rsa", modulusLength: 4096 },
      { privateKeyFormat: "pkcs1-pem" }
    );

    //@ts-ignore Need to access private attribute
    const privateKey = pem2jwk(keyPair.privateKey);
    delete privateKey.alg;
    delete privateKey.key_ops;
    return privateKey;
  }

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

/**
 * Get cached data from path
 * @param path Path to cached data
 * @returns Data as generic type T
 */
export function getCacheData<T>(path: string): Promise<AxiosResponse<T>> {
  return axios.get(path);
}

/**
 * Get info from Arweave net
 * @returns Axios response with info
 */
function getArweaveNetInfo(): Promise<AxiosResponse<any>> {
  return axios.get(URL_ARWEAVE_INFO);
}

module.exports = {
  BUNDLER_NODES,
  arweave,
  Common,
  getCacheData
};
