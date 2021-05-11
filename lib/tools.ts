import { generateMnemonic, getKeyFromMnemonic } from "../helpers/mnemonic_keys";
import Arweave = require("arweave");
import { JWKInterface } from "arweave/node/lib/wallet";
import * as fs from "fs";
import axios, { AxiosResponse } from "axios";
import { smartweave } from "smartweave";
import * as ArweaveUtils from "arweave/node/lib/utils";
import "nedb-promises"; // Datastore
import Datastore = require("nedb-promises");

interface Vote {
  voteId: number;
  direct?: string;
  userVote?: string;
}

interface BundlerPayload {
  vote: Vote;
  senderAddress: string;
  signature?: string;
  owner?: string;
}

const KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
const ADDR_BUNDLER = "https://bundler.openkoi.com:8888";
const ADDR_BUNDLER_NODES = ADDR_BUNDLER + "/submitVote/";
const ADDR_LOGS = "https://arweave.dev/logs";
const ADDR_ARWEAVE_INFO = "https://arweave.net/info";

export enum BasicTx {
  Stake = "stake",
  Withdraw = "withdraw",
  Transfer = "transfer"
}

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443
});

/**
 * Tools for interacting with the koi network
 */
export class Koi {
  redisClient;
  totalVoted = -1;
  wallet?: JWKInterface;
  myBookmarks: Map<string, string> = new Map();
  receipts: any[] = [];
  nodeState = {};
  contractAddress = KOI_CONTRACT;
  mnemonic?: string;
  address?: string;
  balance?: string;
  db?: Datastore;

  constructor() {
    console.log(
      "Initialized a Koi Node with smart contract: ",
      this.contractAddress
    );
  }

  /**
   * Generates wallet optionally with a mnemonic phrase
   * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
   */
  async generateWallet(use_mnemonic = false): Promise<Error | true> {
    let key: JWKInterface, mnemonic: string | undefined;
    if (use_mnemonic === true) {
      mnemonic = await generateMnemonic();
      key = await getKeyFromMnemonic(mnemonic);
    } else key = await arweave.wallets.generate();

    if (!key) throw Error("failed to create wallet");

    this.mnemonic = mnemonic;
    this.wallet = key;
    await this.getWalletAddress();
    return true;
  }

  /**
   * Loads arweave wallet
   * @param source string or object to load from
   */
  async loadWallet(source: any): Promise<void> {
    switch (typeof source) {
      case "string":
        if (
          /^[a-zA-Z ]+$/.test(source) &&
          source.trim().split(" ").length === 12
        ) {
          this.mnemonic = source;
          this.wallet = await getKeyFromMnemonic(source); // This can take a minute
        } else {
          this.wallet = await this.loadFile(source);
        }
        break;
      case "object":
        this.wallet = source;
    }
  }

  /**
   * Asynchronously load a wallet from a UTF8 JSON file
   * @param file Path of the file to be loaded
   * @returns Wallet
   */
  loadFile(file: string): Promise<JWKInterface> {
    return new Promise(function (resolve, reject) {
      fs.readFile(file, "utf8", (err, data) => {
        if (err !== null) reject(err);
        resolve(JSON.parse(data));
      });
    });
  }

  /**
   * Uses koi wallet to get the address
   * @returns Wallet address
   */
  async getWalletAddress(): Promise<string> {
    if (!this.address)
      this.address = await arweave.wallets.jwkToAddress(this.wallet);
    return this.address;
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
   * Get and set arweave balance
   * @returns Balance as a string if wallet exists, else undefined
   */
  getWalletBalance(): Promise<string> | void {
    if (this.address) return arweave.wallets.getBalance(this.address);
  }

  /**
   * Loads wallet for node Simulator key from file path and initialize ndb.
   * @param walletFileLocation Wallet key file location
   * @returns Key as an object
   */
  async nodeLoadWallet(walletFileLocation) {
    await this.loadWallet(walletFileLocation);
    this.db = Datastore.create({
      filename: "my-db.db",
      autoload: true
    });
    const count = await this.db.count({});
    if (count == 0) {
      const data = {
        totalVoted: 32,
        receipt: []
      };

      await this.db.insert(data);

      this.totalVoted = data.totalVoted;
    } else {
      const data: any = await this.db.find({});
      this.totalVoted = data[0].totalVoted;
      this.receipts.push(data[0].receipt);
    }
    return this.wallet;
  }

  /**
   * Adds content to bookmarks
   * @param arTxId Arweave transaction ID
   * @param ref Content stored in transaction
   */
  addToBookmarks(arTxId: string, ref: string): void {
    if (this.myBookmarks.has(arTxId)) {
      throw Error(
        `cannot assign a bookmark to ${arTxId} since it already has a note ${ref}`
      );
    }

    this.myBookmarks.set(arTxId, ref);
    //this.myBookmarks[ref] = arTxId; // I don't see why we should do this
  }

  /**
   * Gets koi balance from cache
   * @returns Balance as a number
   */
  async getKoiBalance(): Promise<number> {
    const path = ADDR_BUNDLER + "/state/current/";
    const state = await getCacheData<any>(path);

    if (
      typeof this.address !== "undefined" &&
      this.address in state.data.balances
    )
      return state.data.balances[this.address];
    return 0;
  }

  /**
   * Basic interaction transaction
   * @param qty Quantity to stake
   * @returns Transaction id
   */
  transact(tx_type: BasicTx, qty: number): Promise<string> {
    if (!Number.isInteger(qty))
      throw Error('Invalid value for "qty". Must be an integer');

    const input = {
      function: tx_type,
      qty: qty
    };

    return this._interactWrite(input);
  }

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
   * Submit vote to bundle server or direct to contract
   * @param arg Object with direct, voteId, and useVote
   * @returns Transaction ID
   */
  async vote(arg: Vote): Promise<any> {
    const userVote = await this.validateData(arg.voteId);
    if (userVote == null) {
      this.totalVoted += 1;
      await this._db();
      return { message: "VoteTimePassed" };
    }

    const input = {
      function: "vote",
      voteId: arg.voteId,
      userVote: userVote.toString()
    };

    let receipt;
    let tx;
    if (arg.direct) tx = await this._interactWrite(input);
    else {
      const caller = await this.getWalletAddress();

      const payload: BundlerPayload = {
        vote: input,
        senderAddress: caller
      };

      receipt = await this._bundlerNode(payload);
    }

    if (tx) {
      this.totalVoted += 1;
      await this._db();
      return { message: "justVoted" };
    }

    if (receipt) {
      if (this.db !== undefined && receipt.status === 200) {
        this.totalVoted += 1;
        const data = receipt.data.receipt;
        const id = await this._db();
        await this.db.update({ _id: id }, { $push: { receipt: data } });
        this.receipts.push(data);
        return { message: "success" };
      }

      console.log(receipt);
      this.totalVoted += 1;
      await this._db();
      return { message: "duplicatedVote" };
    }

    return null;
  }

  /**
   * Validate trafficlog by comparing traffic log from gateway and arweave storage
   * @param voteId Vote id which is belongs for specific proposalLog
   * @returns Whether data is valid
   */
  async validateData(voteId: number): Promise<boolean | null> {
    const state = await this._readContract();
    const trafficLogs = state.stateUpdate.trafficLogs;
    const currentTrafficLogs = trafficLogs.dailyTrafficLog.find(
      (trafficLog) => trafficLog.block === trafficLogs.open
    );
    const proposedLogs = currentTrafficLogs.proposedLogs;
    let proposedLog: null | any = null;
    proposedLogs.forEach((element) => {
      if (element.voteId === voteId) {
        proposedLog = element;
      }
    });
    // lets assume we have one gateway id for now.
    //let gateWayUrl = proposedLog.gatWayId;

    if (proposedLog === null) return null;

    const gatewayTrafficLogs = await this._getTrafficLogFromGateWay(ADDR_LOGS);
    const gatewayTrafficLogsHash = await this._hashData(
      gatewayTrafficLogs.data.summary
    );

    let bundledTrafficLogs = await arweave.transactions.getData(
      proposedLog.TLTxId,
      { decode: true, string: true }
    );

    if (typeof bundledTrafficLogs !== "string")
      bundledTrafficLogs = new TextDecoder("utf-8").decode(bundledTrafficLogs);
    const bundledTrafficLogsParsed = JSON.parse(bundledTrafficLogs);
    const bundledTrafficLogsParsedHash = await this._hashData(
      bundledTrafficLogsParsed
    );

    return gatewayTrafficLogsHash === bundledTrafficLogsParsedHash;
  }

  /**
   * Sign payload
   * @param payload Payload to sign
   * @returns Signed payload with signature
   */
  async signPayload(payload: BundlerPayload): Promise<BundlerPayload | null> {
    if (this.wallet === undefined) return null;
    const jwk = this.wallet;
    const publicModulus = jwk.n;
    const dataInString = JSON.stringify(payload.vote);
    const dataIn8Array = ArweaveUtils.stringToBuffer(dataInString);
    const rawSignature = await arweave.crypto.sign(jwk, dataIn8Array);
    payload.signature = ArweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }

  /**
   * Propose a stake slashing
   * @returns
   */
  async proposeSlash(): Promise<void> {
    const state = await this.getContractState();
    const votes = state.votes;
    for (let i; i < this.receipts.length - 1; i++) {
      const element = this.receipts[i];
      const voteId = element.vote.vote.voteId;
      const vote = votes[voteId];
      if (!vote.voted.includes(this.wallet)) {
        const input = {
          function: "proposeSlash",
          receipt: element
        };
        await this._interactWrite(input);
      }
    }
  }

  /**
   * @returns Current KOI system state
   */
  getContractState(): Promise<any> {
    return this._readContract();
  }

  /**
   * Get block height
   * @returns Block height // maybe number
   */
  async getBlockHeight(): Promise<any> {
    const info = await getArweaveNetInfo();
    return info.data.height;
  }

  /**
   *
   * @returns
   */
  rankProposal(): Promise<string> {
    const input = {
      function: "rankProposal"
    };
    return this._interactWrite(input);
  }

  // Private functions

  /**
   * Writes to contract
   * @param input Passes to smartweave write function, in order to execute a contract function
   * @returns Transaction ID
   */
  private _interactWrite(input: any): Promise<string> {
    const wallet = typeof this.wallet == "object" ? this.wallet : "use_wallet";

    return smartweave.interactWrite(arweave, wallet, KOI_CONTRACT, input);
  }

  /**
   * Read contract latest state
   * @returns Contract
   */
  private _readContract(): Promise<any> {
    return smartweave.readContract(arweave, KOI_CONTRACT);
  }

  /**
   * Get traffic logs from gateway
   * @param path Gateway url
   * @returns Result as a promise
   */
  private _getTrafficLogFromGateWay(path: string): Promise<any> {
    return axios.get(path);
  }

  /**
   * Read contract latest state
   * @param data Data to be hashed
   * @returns Hex string
   */
  private async _hashData(data: any): Promise<string> {
    const dataInString = JSON.stringify(data);
    const dataIn8Array = ArweaveUtils.stringToBuffer(dataInString);
    const hashBuffer = await arweave.crypto.hash(dataIn8Array);
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return hashHex;
  }

  /**
   * Read the data and update
   * @returns Database document ID
   */
  private async _db(): Promise<string | null> {
    if (this.db === undefined) return null;

    const dataB: any = await this.db.find({});
    const id: string = dataB[0]._id;
    const receipt = dataB[0].receipt; // dataB is forced to any to allow .receipt
    await this.db.update(
      { _id: id },
      {
        totalVoted: this.totalVoted,
        receipt: receipt
      }
    );
    return id;
  }

  /**
   * Submits a payload to server
   * @param payload Payload to be submitted
   * @returns Result as a promise
   */
  private async _bundlerNode(
    payload: BundlerPayload
  ): Promise<AxiosResponse<any> | null> {
    const sigResult = await this.signPayload(payload);
    return sigResult !== null
      ? await axios.post(ADDR_BUNDLER_NODES, sigResult)
      : null;
  }
}

/**
 * Get cached data from path
 * @param path Path to cached data
 * @returns Data as generic type T
 */
function getCacheData<T>(path: string): Promise<AxiosResponse<T>> {
  return axios.get(path);
}

/**
 * Get info from Arweave net
 * @returns Axios response with info
 */
function getArweaveNetInfo(): Promise<AxiosResponse<any>> {
  return axios.get(ADDR_ARWEAVE_INFO);
}
