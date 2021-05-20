import axios, { AxiosResponse } from "axios";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as arweaveUtils from "arweave/node/lib/utils";
import Transaction from "arweave/node/lib/transaction";
import { smartweave } from "smartweave";
import { Query } from "@kyve/query";

//@ts-ignore // Needed to allow implicit any here
import { generateKeyPair, getKeyPairFromMnemonic } from "human-crypto-keys";
import * as crypto from "libp2p-crypto";

export interface Vote {
  voteId: string;
  direct?: string;
  userVote?: string;
}

export interface BundlerPayload {
  vote: Vote;
  senderAddress: string;
  signature?: string;
  owner?: string;
}

export const ADDR_BUNDLER = "https://bundler.openkoi.com:8888";
export const ADDR_BUNDLER_CURRENT = ADDR_BUNDLER + "/state/current";
export const KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
const ADDR_ARWEAVE_INFO = "https://arweave.net/info";

export const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443
});

/**
 * Tools for interacting with the koi network
 */
export class Common {
  wallet?: JWKInterface;
  myBookmarks: Map<string, string> = new Map();
  contractAddress = KOI_CONTRACT;
  mnemonic?: string;
  address?: string;

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
      this.address = (await arweave.wallets.jwkToAddress(
        this.wallet
      )) as string;
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
   * Gets koi balance from cache
   * @returns Balance as a number
   */
  async getKoiBalance(): Promise<number> {
    const state = await getCacheData<any>(ADDR_BUNDLER_CURRENT);

    if (
      typeof this.address !== "undefined" &&
      this.address in state.data.balances
    )
      return state.data.balances[this.address];
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
   * @param target Reciever address
   * @returns Transaction ID
   */
  transfer(qty: number, target: string): Promise<string> {
    const input = {
      function: "transfer",
      qty: qty,
      target: target
    };

    return this._interactWrite(input);
  }

  /**
   * Mint koi
   * @param arg object arg.targetAddress(reciever address) and arg.qty(amount to mint)
   * @returns Transaction ID
   */
  mint(arg: any): Promise<string> {
    const input = {
      function: "mint",
      target: arg.targetAddress,
      qty: arg.qty
    };

    return this._interactWrite(input);
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
    const jwk = this.wallet;
    const publicModulus = jwk.n;
    const dataInString = JSON.stringify(payload.vote);
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
    const rawSignature = arweaveUtils.b64UrlToBuffer(payload.signature);
    const dataInString = JSON.stringify(payload.vote);
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
   * Gets all the transactions from a wallet address
   * @param wallet Wallet address as a string
   * @returns Array of transaction id strings
   */
  getWalletTxs(wallet: string): Promise<Array<string>> {
    return arweave.arql({
      op: "equals",
      expr1: "from",
      expr2: wallet
    });
  }

  // Protected functions

  /**
   * Writes to contract
   * @param input Passes to smartweave write function, in order to execute a contract function
   * @returns Transaction ID
   */
  protected _interactWrite(input: any): Promise<string> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    return smartweave.interactWrite(arweave, wallet, KOI_CONTRACT, input);
  }

  /**
   * Read contract latest state
   * @returns Contract
   */
  protected async _readContract(): Promise<any> {
    // return smartweave.readContract(arweave, KOI_CONTRACT);
    const poolID = 4;
    const query = new Query(poolID);
    // finding latest transactions
    const object = await query.limit(1).find();
    return object.length > 0 ? JSON.parse(object[0]).state : [];
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
    const privateKey = (await crypto.keys.import(keyPair.privateKey, ""))._key;
    delete privateKey.alg;
    delete privateKey.key_ops;
    return privateKey;
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
  return axios.get(ADDR_ARWEAVE_INFO);
}

module.exports = { ADDR_BUNDLER, KOI_CONTRACT, Common, getCacheData };
