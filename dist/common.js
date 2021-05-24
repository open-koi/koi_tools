"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheData = exports.Common = exports.arweave = exports.ADDR_BUNDLER_CURRENT = exports.ADDR_BUNDLER = exports.ADDR_ARWEAVE_INFO = exports.KOI_CONTRACT = void 0;
const axios_1 = __importDefault(require("axios"));
const arweave_1 = __importDefault(require("arweave"));
const arweaveUtils = __importStar(require("arweave/node/lib/utils"));
const smartweave_1 = require("smartweave");
const query_1 = require("@kyve/query");
//@ts-ignore // Needed to allow implicit any here
const human_crypto_keys_1 = require("human-crypto-keys");
const crypto = __importStar(require("libp2p-crypto"));
exports.KOI_CONTRACT = "ljy4rdr6vKS6-jLgduBz_wlcad4GuKPEuhrRVaUd8tg";
exports.ADDR_ARWEAVE_INFO = "https://arweave.net/info";
exports.ADDR_BUNDLER = "https://bundler.openkoi.com:8888";
exports.ADDR_BUNDLER_CURRENT = exports.ADDR_BUNDLER + "/state/current";
exports.arweave = arweave_1.default.init({
    host: "arweave.net",
    protocol: "https",
    port: 443
});
/**
 * Tools for interacting with the koi network
 */
class Common {
    constructor() {
        this.myBookmarks = new Map();
        this.contractAddress = exports.KOI_CONTRACT;
        console.log("Initialized a Koi Node with smart contract: ", this.contractAddress);
    }
    /**
     * Generates wallet optionally with a mnemonic phrase
     * @param use_mnemonic [false] Flag for enabling mnemonic phrase wallet generation
     */
    async generateWallet(use_mnemonic = false) {
        let key, mnemonic;
        if (use_mnemonic === true) {
            mnemonic = await this._generateMnemonic();
            key = await this._getKeyFromMnemonic(mnemonic);
        }
        else
            key = await exports.arweave.wallets.generate();
        if (!key)
            throw Error("failed to create wallet");
        this.mnemonic = mnemonic;
        this.wallet = key;
        await this.getWalletAddress();
        return true;
    }
    /**
     * Loads arweave wallet
     * @param source object to load from, JSON or JWK, or mnemonic key
     */
    async loadWallet(source) {
        switch (typeof source) {
            case "string":
                this.wallet = await this._getKeyFromMnemonic(source);
                break;
            default:
                this.wallet = source;
        }
        await this.getWalletAddress();
        return this.wallet;
    }
    /**
     * Manually set wallet address
     * @param walletAddress Address as a string
     * @returns Wallet address
     */
    setWallet(walletAddress) {
        if (!this.address)
            this.address = walletAddress;
        return this.address;
    }
    /**
     * Uses koi wallet to get the address
     * @returns Wallet address
     */
    async getWalletAddress() {
        if (typeof this.address !== "string")
            this.address = (await exports.arweave.wallets.jwkToAddress(this.wallet));
        return this.address;
    }
    /**
     * Get and set arweave balance
     * @returns Balance as a string if wallet exists, else undefined
     */
    getWalletBalance() {
        if (this.address)
            return exports.arweave.wallets.getBalance(this.address);
    }
    /**
     * Gets koi balance from cache
     * @returns Balance as a number
     */
    async getKoiBalance() {
        const state = await getCacheData(exports.ADDR_BUNDLER_CURRENT);
        if (this.address !== undefined && this.address in state.data.balances)
            return state.data.balances[this.address];
        return 0;
    }
    /**
     * @returns Current KOI system state
     */
    getContractState() {
        return this._readContract();
    }
    /**
     * Get contract state
     * @param id Transaction ID
     * @returns State object
     */
    async getTransaction(id) {
        return exports.arweave.transactions.get(id);
    }
    /**
     * Get block height
     * @returns Block height maybe number
     */
    async getBlockHeight() {
        const info = await getArweaveNetInfo();
        return info.data.height;
    }
    /**
     *
     * @param txId
     * @returns
     */
    async readNftState(txId) {
        return smartweave_1.smartweave.readContract(exports.arweave, txId);
    }
    /**
     * Adds content to bookmarks
     * @param arTxId Arweave transaction ID
     * @param ref Content stored in transaction
     */
    addToBookmarks(arTxId, ref) {
        if (this.myBookmarks.has(arTxId)) {
            throw Error(`cannot assign a bookmark to ${arTxId} since it already has a note ${ref}`);
        }
        this.myBookmarks.set(arTxId, ref);
        //this.myBookmarks[ref] = arTxId; // I don't see why we should do this
    }
    /**
     * Interact with contract to stake
     * @param qty Quantity to stake
     * @returns Transaction ID
     */
    stake(qty) {
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
    withdraw(qty) {
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
    transfer(qty, target) {
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
    mint(arg) {
        const input = {
            function: "mint",
            target: arg.targetAddress,
            qty: arg.qty
        };
        return this._interactWrite(input);
    }
    /**
     * Interact with contract to register data
     * @param txId It has batchFile/value(string) and stakeamount/value(int) as properties
     * @param ownerId String container the owner ID
     * @returns Transaction ID
     */
    registerData(txId, ownerId = "") {
        const input = {
            function: "registerData",
            txId: txId,
            owner: ownerId
        };
        return this._interactWrite(input);
    }
    /**
     * Get transaction data from Arweave
     * @param txId Transaction ID
     * @returns Transaction
     */
    nftTransactionData(txId) {
        return exports.arweave.transactions.get(txId);
    }
    /**
     * Sign payload
     * @param payload Payload to sign
     * @returns Signed payload with signature
     */
    async signPayload(payload) {
        if (this.wallet === undefined)
            return null;
        const jwk = this.wallet;
        const publicModulus = jwk.n;
        const dataInString = JSON.stringify(payload.vote);
        const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
        const rawSignature = await exports.arweave.crypto.sign(jwk, dataIn8Array);
        payload.signature = arweaveUtils.bufferTob64Url(rawSignature);
        payload.owner = publicModulus;
        return payload;
    }
    /**
     * Verify signed payload
     * @param payload
     * @returns Verification result
     */
    async verifySignature(payload) {
        const rawSignature = arweaveUtils.b64UrlToBuffer(payload.signature);
        const dataInString = JSON.stringify(payload.vote);
        const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
        return await exports.arweave.crypto.verify(payload.owner, dataIn8Array, rawSignature);
    }
    /**
     * posts data on arweave.
     * @param data
     * @returns Transaction ID
     */
    async postData(data) {
        // TODO: define data interface
        const wallet = this.wallet;
        const transaction = await exports.arweave.createTransaction({
            data: Buffer.from(JSON.stringify(data, null, 2), "utf8")
        }, wallet);
        // Now we sign the transaction
        await exports.arweave.transactions.sign(transaction, wallet);
        const txId = transaction.id;
        // After is signed, we send the transaction
        const response = await exports.arweave.transactions.post(transaction);
        if (response.status === 200)
            return txId;
        return null;
    }
    /**
     * Gets all the transactions from a wallet address
     * @param wallet Wallet address as a string
     * @returns Array of wallet transaction data
     */
    async getWalletTxs(wallet) {
        const txIds = await exports.arweave.arql({
            op: "equals",
            expr1: "from",
            expr2: wallet
        });
        return txIds.map((txId) => exports.arweave.transactions.getData(txId));
    }
    /**
     *
     * @param contentTxId TxId of the content
     * @param state
     * @returns An object with {totaltViews, totalReward, 24hrsViews}
     */
    async contentView(contentTxId, state) {
        // const state = await this.getContractState();
        // const path = "https://bundler.openkoi.com/state/current/";
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
            rewardReport.forEach((ele) => {
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
        }
        catch (err) {
            return null;
        }
    }
    /**
     * returns the top contents registered in Koi in array
     * @returns
     */
    async retrieveTopContent() {
        const allContents = await this._retrieveAllContent();
        allContents.sort(function (a, b) {
            return b.totalViews - a.totalViews;
        });
        return allContents;
    }
    // Protected functions
    /**
     * Writes to contract
     * @param input Passes to smartweave write function, in order to execute a contract function
     * @returns Transaction ID
     */
    _interactWrite(input) {
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        return smartweave_1.smartweave.interactWrite(exports.arweave, wallet, exports.KOI_CONTRACT, input);
    }
    /**
     * Read contract latest state
     * @returns Contract
     */
    async _readContract() {
        // return smartweave.readContract(arweave, KOI_CONTRACT);
        const poolID = 4;
        const query = new query_1.Query(poolID);
        // finding latest transactions
        try {
            const snapshotArray = await query.limit(1).find();
            if (snapshotArray && snapshotArray.length > 0) {
                return JSON.parse(snapshotArray[0]).state;
            }
            else
                console.log("NOTHING RETURNED FROM KYVE");
        }
        catch (e) {
            console.log("ERROR RETRIEVING FROM KYVE", e);
        }
        return smartweave_1.smartweave.readContract(exports.arweave, exports.KOI_CONTRACT);
    }
    // Private functions
    /**
     * Generate a 12 word mnemonic for an Arweave key https://github.com/acolytec3/arweave-mnemonic-keys
     * @returns {string} - a promise resolving to a 12 word mnemonic seed phrase
     */
    async _generateMnemonic() {
        const keys = await human_crypto_keys_1.generateKeyPair({ id: "rsa", modulusLength: 4096 }, { privateKeyFormat: "pkcs1-pem" });
        return keys.mnemonic;
    }
    /**
     * Generates a JWK object representation of an Arweave key
     * @param mnemonic - a 12 word mnemonic represented as a string
     * @returns {object} - returns a Javascript object that conforms to the JWKInterface required by Arweave-js
     */
    async _getKeyFromMnemonic(mnemonic) {
        const keyPair = await human_crypto_keys_1.getKeyPairFromMnemonic(mnemonic, { id: "rsa", modulusLength: 4096 }, { privateKeyFormat: "pkcs1-pem" });
        //@ts-ignore Need to access private attribute
        const privateKey = (await crypto.keys.import(keyPair.privateKey, ""))._key;
        delete privateKey.alg;
        delete privateKey.key_ops;
        return privateKey;
    }
    /**
     *
     * @returns
     */
    async _retrieveAllContent() {
        const state = await this.getContractState();
        const registerRecords = state.registeredRecord;
        const txIdArr = Object.keys(registerRecords);
        const contentViewPromises = txIdArr.map((txId) => this.contentView(txId, state));
        // Required any to convert PromiseSettleResult to PromiseFulfilledResult<any>
        const contents = await Promise.all(contentViewPromises);
        const result = contents.filter((res) => res.value !== null);
        const clean = result.map((res) => res.value);
        return clean;
    }
}
exports.Common = Common;
/**
 * Get cached data from path
 * @param path Path to cached data
 * @returns Data as generic type T
 */
function getCacheData(path) {
    return axios_1.default.get(path);
}
exports.getCacheData = getCacheData;
/**
 * Get info from Arweave net
 * @returns Axios response with info
 */
function getArweaveNetInfo() {
    return axios_1.default.get(exports.ADDR_ARWEAVE_INFO);
}
module.exports = { ADDR_BUNDLER: exports.ADDR_BUNDLER, KOI_CONTRACT: exports.KOI_CONTRACT, Common, getCacheData };
//# sourceMappingURL=common.js.map