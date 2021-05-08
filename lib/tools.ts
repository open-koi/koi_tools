import { generateMnemonic, getKeyFromMnemonic } from "../helpers/mnemonic_keys";
import Arweave = require("arweave");
import { JWKInterface } from "arweave/node/lib/wallet";
import * as fs from "fs";

const KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
const BUNDLER_NODES = "https://bundler.openkoi.com:8888/submitVote/";

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
  async generateWallet(use_mnemonic = false): Promise<any> {
    let key: any, mnemonic: string | undefined;
    if (use_mnemonic === true) {
      mnemonic = await generateMnemonic();
      key = await getKeyFromMnemonic(mnemonic);
    } else key = await arweave.wallets.generate();

    if (!key) throw "failed to create wallet";

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
  async loadFile(file: string): Promise<JWKInterface> {
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
  async getWalletBalance(): Promise<string | undefined> {
    if (this.address)
      this.balance = await arweave.wallets.getBalance(this.address);
    return this.balance;
  }

  /**
   * Adds content to bookmarks
   * @param arTxId Arweave transaction ID
   * @param ref Content to be stored in transaction
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
}
