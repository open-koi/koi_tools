import { AxiosResponse } from "axios";
import Arweave from "arweave";
import { JWKInterface } from "arweave/node/lib/wallet";
import Transaction from "arweave/node/lib/transaction";
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
export declare const KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
export declare const ADDR_ARWEAVE_INFO = "https://arweave.net/info";
export declare const ADDR_BUNDLER = "https://bundler.openkoi.com:8888";
export declare const ADDR_BUNDLER_CURRENT: string;
export declare const arweave: Arweave;
/**
 * Tools for interacting with the koi network
 */
export declare class Common {
    wallet?: JWKInterface;
    myBookmarks: Map<string, string>;
    contractAddress: string;
    mnemonic?: string;
    address?: string;
    constructor();
    /**
     * Generates wallet optionally with a mnemonic phrase
     * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
     */
    generateWallet(use_mnemonic?: boolean): Promise<Error | true>;
    /**
     * Loads arweave wallet
     * @param source object to load from, JSON or JWK, or mnemonic key
     */
    loadWallet(source: any): Promise<JWKInterface>;
    /**
     * Manually set wallet address
     * @param walletAddress Address as a string
     * @returns Wallet address
     */
    setWallet(walletAddress: string): string;
    /**
     * Uses koi wallet to get the address
     * @returns Wallet address
     */
    getWalletAddress(): Promise<string>;
    /**
     * Get and set arweave balance
     * @returns Balance as a string if wallet exists, else undefined
     */
    getWalletBalance(): Promise<string> | void;
    /**
     * Gets koi balance from cache
     * @returns Balance as a number
     */
    getKoiBalance(): Promise<number>;
    /**
     * @returns Current KOI system state
     */
    getContractState(): Promise<any>;
    /**
     * Get contract state
     * @param id Transaction ID
     * @returns State object
     */
    getTransaction(id: string): Promise<Transaction>;
    /**
     * Get block height
     * @returns Block height maybe number
     */
    getBlockHeight(): Promise<any>;
    /**
     *
     * @param txId
     * @returns
     */
    readNftState(txId: string): Promise<any>;
    /**
     * Adds content to bookmarks
     * @param arTxId Arweave transaction ID
     * @param ref Content stored in transaction
     */
    addToBookmarks(arTxId: string, ref: string): void;
    /**
     * Interact with contract to stake
     * @param qty Quantity to stake
     * @returns Transaction ID
     */
    stake(qty: number): Promise<string>;
    /**
     * Interact with contract to withdraw
     * @param qty Quantity to transfer
     * @returns Transaction ID
     */
    withdraw(qty: number): Promise<string>;
    /**
     * Interact with contract to transfer koi
     * @param qty Quantity to transfer
     * @param target Reciever address
     * @returns Transaction ID
     */
    transfer(qty: number, target: string): Promise<string>;
    /**
     * Mint koi
     * @param arg object arg.targetAddress(reciever address) and arg.qty(amount to mint)
     * @returns Transaction ID
     */
    mint(arg: any): Promise<string>;
    /**
     * Interact with contract to register data
     * @param txId It has batchFile/value(string) and stakeamount/value(int) as properties
     * @param ownerId String container the owner ID
     * @returns Transaction ID
     */
    registerData(txId: string, ownerId?: string): Promise<string>;
    /**
     * Get transaction data from Arweave
     * @param txId Transaction ID
     * @returns Transaction
     */
    nftTransactionData(txId: string): Promise<Transaction>;
    /**
     * Sign payload
     * @param payload Payload to sign
     * @returns Signed payload with signature
     */
    signPayload(payload: BundlerPayload): Promise<BundlerPayload | null>;
    /**
     * Verify signed payload
     * @param payload
     * @returns Verification result
     */
    verifySignature(payload: any): Promise<boolean>;
    /**
     * posts data on arweave.
     * @param data
     * @returns Transaction ID
     */
    postData(data: any): Promise<string | null>;
    /**
     * Gets all the transactions from a wallet address
     * @param wallet Wallet address as a string
     * @returns Array of wallet transaction data
     */
    getWalletTxs(wallet: string): Promise<Array<any>>;
    /**
     *
     * @param contentTxId TxId of the content
     * @param state
     * @returns An object with {totaltViews, totalReward, 24hrsViews}
     */
    contentView(contentTxId: any, state: any): Promise<any>;
    /**
     * returns the top contents registered in Koi in array
     * @returns
     */
    retrieveTopContent(): Promise<any>;
    /**
     * Writes to contract
     * @param input Passes to smartweave write function, in order to execute a contract function
     * @returns Transaction ID
     */
    protected _interactWrite(input: any): Promise<string>;
    /**
     * Read contract latest state
     * @returns Contract
     */
    protected _readContract(): Promise<any>;
    /**
     * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
     * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
     */
    private _generateMnemonic;
    /**
     * Generates a JWK object representation of an Arweave key
     * @param mnemonic - a 12 word mnemonic represented as a string
     * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
     */
    private _getKeyFromMnemonic;
    /**
     *
     * @returns
     */
    private _retrieveAllContent;
}
/**
 * Get cached data from path
 * @param path Path to cached data
 * @returns Data as generic type T
 */
export declare function getCacheData<T>(path: string): Promise<AxiosResponse<T>>;
