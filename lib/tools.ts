import { generateMnemonic, getKeyFromMnemonic } from "../helpers/mnemonic_keys";
import Arweave = require("arweave");
import { JWKInterface } from "arweave/node/lib/wallet";
import * as fs from "fs";
import axios, { AxiosResponse } from "axios";
import { smartweave } from "smartweave";

const KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
const BUNDLER_ADDR = "https://bundler.openkoi.com:8888";
const BUNDLER_ADDR_NODES = BUNDLER_ADDR + "/submitVote/";

enum BASIC_TX {
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
  receipts = [];
  nodeState = {};
  contractAddress = KOI_CONTRACT;
  mnemonic?: string;
  address?: string;
  balance?: string;

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
        if (err === null) resolve(JSON.parse(data));
        else reject(err);
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
   * @returns balance as a number
   */
  async getKoiBalance(): Promise<number> {
    const path = BUNDLER_ADDR + "/state/current/";
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
   * @param qty quantity to stake
   * @returns transaction id
   */
  transact(tx_type: BASIC_TX, qty: number): Promise<string> {
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
   * @param txId it has batchFile/value(string) and stakeamount/value(int) as properties
   * @param owner
   * @param arWallet
   * @param arweaveInst arweave client instance
   * @returns transaction ID
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
   * internal function, writes to contract
   * @param input Passes to smartweave write function, in order to execute a contract function
   * @returns Transaction ID
   */
  private _interactWrite(input: any): Promise<string> {
    const wallet = typeof this.wallet == "object" ? this.wallet : "use_wallet";

    return smartweave.interactWrite(arweave, wallet, KOI_CONTRACT, input);
  }

  /**
   * Submit vote to bundle server or direct to contract
   * @param arg Object with direct, voteId, and useVote
   * @returns Transaction ID
   */
  async vote(arg: {
    direct: boolean;
    voteId: string;
    useVote: string;
  }): Promise<any> {
    const userVote = await this.validateData(arg.voteId);
    if (userVote == null) {
      this.totalVoted += 1;
      await this._db();
      return { message: "VoteTimePassed" };
    }

    const input = {
      function: "vote",
      voteId: arg.voteId,
      userVote: userVote
    };

    let reciept;
    let tx;
    if (arg.direct === true) {
      tx = await this._interactWrite(input);
    } else {
      const caller = await this.getWalletAddress();
      const userVoteBoolean = new Boolean(userVote);

      const userVoteString = userVoteBoolean.toString();

      input.userVote = userVoteString;
      const payload = {
        vote: input,
        senderAddress: caller
      };

      reciept = await this._bundlerNode(payload);
    }

    if (tx) {
      this.totalVoted += 1;
      await this._db();
      return { message: "justVoted" };
    }

    if (reciept) {
      if (reciept.status == 200) {
        this.totalVoted += 1;
        const data = reciept.data.receipt;
        const id = await this._db();
        await this.db.update({ _id: id }, { $push: { receipt: data } });
        this.reciepts.push(data);
        return { message: "success" };
      } else {
        console.log(reciept);
        this.totalVoted += 1;
        await this._db();

        return { message: "duplicatedVote" };
      }
    }

    return null;
  }

  /**
   * Validate trafficlog by comparing traffic log from gateway and arweave storage
   * @param voteId vote id which is belongs for specific proposalLog
   * @returns whether data is valid
   */
  async validateData(voteId: string): Promise<boolean | null> {
    const state = await this.getContractState();
    const trafficLogs = state.stateUpdate.trafficLogs;
    const currentTrafficLogs = trafficLogs.dailyTrafficLog.find(
      (trafficlog) => trafficlog.block === trafficLogs.open
    );
    const proposedLogs = currentTrafficLogs.proposedLogs;
    let proposedLog = null;
    proposedLogs.forEach((element) => {
      if (element.voteId === voteId) {
        proposedLog = element;
      }
    });
    // lets assume we have one gateway id for now.
    //let gateWayUrl = proposedLog.gatWayId;

    if (proposedLog === null) {
      return null;
    }
    const gatewayTrafficLogs = await this._getTrafficLogFromGateWay(
      "https://arweave.dev/logs"
    );
    const gatewayTrafficLogsHash = await this._hashData(
      gatewayTrafficLogs.data.summary
    );

    const bundledTrafficLogs = await arweave.transactions.getData(
      proposedLog.TLTxId,
      { decode: true, string: true }
    );

    const bundledTrafficLogsParsed = JSON.parse(bundledTrafficLogs);
    const bundledTrafficLogsParsedHash = await this._hashData(
      bundledTrafficLogsParsed
    );
    const isValid = gatewayTrafficLogsHash === bundledTrafficLogsParsedHash;

    return isValid;
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
