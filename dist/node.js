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
exports.Node = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const common_1 = require("./common");
const fs = __importStar(require("fs"));
const nedb_promises_1 = __importDefault(require("nedb-promises"));
const axios_1 = __importDefault(require("axios"));
const arweaveUtils = __importStar(require("arweave/node/lib/utils"));
const smartweave_1 = require("smartweave");
const redis_1 = __importDefault(require("redis"));
/*
Koi Node Operation: {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs (or other task data)
  4. submit vote to bundler server
  5. verify vote was added to arweave (after 24 hrs)
}
*/
const ADDR_LOGS = "https://arweave.dev/logs";
const ADDR_BUNDLER_NODES = common_1.ADDR_BUNDLER + "/submitVote/";
class Node extends common_1.Common {
    constructor() {
        super();
        this.totalVoted = -1;
        this.receipts = [];
        this.redisClient = getRedisClient();
    }
    /**
     * Asynchronously load a wallet from a UTF8 JSON file
     * @param file Path of the file to be loaded
     * @returns JSON representation of the object
     */
    loadFile(file) {
        return new Promise(function (resolve, reject) {
            fs.readFile(file, "utf8", (err, data) => {
                if (err !== null)
                    reject(err);
                resolve(JSON.parse(data));
            });
        });
    }
    /**
     * Loads wallet for node Simulator key from file path and initialize ndb.
     * @param walletFileLocation Wallet key file location
     * @returns Key as an object
     */
    async nodeLoadWallet(walletFileLocation) {
        const jwk = await this.loadFile(walletFileLocation);
        await this.loadWallet(jwk);
        this.db = nedb_promises_1.default.create({
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
        }
        else {
            const data = await this.db.find({});
            this.totalVoted = data[0].totalVoted;
            this.receipts.push(data[0].receipt);
        }
        return this.wallet;
    }
    /**
     * Submit vote to bundle server or direct to contract
     * @param arg Object with direct, voteId, and useVote
     * @returns Transaction ID
     */
    async vote(arg) {
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
        if (arg.direct)
            tx = await this._interactWrite(input);
        else {
            const caller = await this.getWalletAddress();
            const payload = {
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
     * propose a tafficLog for vote
     * @param arg
     * @returns object arg.gateway(trafficlog orginal gateway id) and arg.stakeAmount(min required stake to vote)
     */
    async submitTrafficLog(arg) {
        const TLTxId = await this._storeTrafficLogOnArweave(arg.gateWayUrl);
        const input = {
            function: "submitTrafficLog",
            gateWayUrl: arg.gateWayUrl,
            batchTxId: TLTxId,
            stakeAmount: arg.stakeAmount
        };
        return this._interactWrite(input);
    }
    /**
     *
     * @returns
     */
    rankProposal() {
        const input = {
            function: "rankProposal"
        };
        return this._interactWrite(input);
    }
    /**
     * Interact with contract to add the votes
     * @param arg
     * @returns Transaction ID
     */
    batchAction(arg) {
        // input object that pass to contract
        const input = {
            function: "batchAction",
            batchFile: arg.batchFile,
            voteId: arg.voteId,
            bundlerAddress: arg.bundlerAddress
        };
        // interact with contract function batchAction which adds all votes and update the state
        return this._interactWrite(input);
    }
    /**
     * Propose a stake slashing
     * @returns
     */
    async proposeSlash() {
        const state = await this.getContractState();
        const votes = state.votes;
        for (let i = 0; i < this.receipts.length - 1; i++) {
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
     *
     * @returns
     */
    async distributeDailyRewards() {
        const input = {
            function: "distributeRewards"
        };
        return this._interactWrite(input);
    }
    /**
     * Validate trafficlog by comparing traffic log from gateway and arweave storage
     * @param voteId Vote id which is belongs for specific proposalLog
     * @returns Whether data is valid
     */
    async validateData(voteId) {
        const state = await common_1.getCacheData(common_1.ADDR_BUNDLER_CURRENT);
        const trafficLogs = state.data.stateUpdate.trafficLogs;
        const currentTrafficLogs = trafficLogs.dailyTrafficLog.find((trafficLog) => trafficLog.block === trafficLogs.open);
        const proposedLogs = currentTrafficLogs.proposedLogs;
        let proposedLog;
        proposedLogs.forEach((element) => {
            if (element.voteId === voteId) {
                proposedLog = element;
            }
        });
        // lets assume we have one gateway id for now.
        //let gateWayUrl = proposedLog.gatWayId;
        if (proposedLog === null)
            return null;
        const gatewayTrafficLogs = await this._getTrafficLogFromGateWay(ADDR_LOGS);
        const gatewayTrafficLogsHash = await this._hashData(gatewayTrafficLogs.data.summary);
        let bundledTrafficLogs = await common_1.arweave.transactions.getData(proposedLog.TLTxId, { decode: true, string: true });
        if (typeof bundledTrafficLogs !== "string")
            bundledTrafficLogs = new TextDecoder("utf-8").decode(bundledTrafficLogs);
        const bundledTrafficLogsParsed = JSON.parse(bundledTrafficLogs);
        const bundledTrafficLogsParsedHash = await this._hashData(bundledTrafficLogsParsed);
        return gatewayTrafficLogsHash === bundledTrafficLogsParsedHash;
    }
    // Private functions
    /**
     * Read the data and update
     * @returns Database document ID
     */
    async _db() {
        if (this.db === undefined)
            return null;
        const dataB = await this.db.find({});
        const id = dataB[0]._id;
        const receipt = dataB[0].receipt; // dataB is forced to any to allow .receipt
        await this.db.update({ _id: id }, {
            totalVoted: this.totalVoted,
            receipt: receipt
        });
        return id;
    }
    /**
     * Submits a payload to server
     * @param payload Payload to be submitted
     * @returns Result as a promise
     */
    async _bundlerNode(payload) {
        const sigResult = await this.signPayload(payload);
        return sigResult !== null
            ? await axios_1.default.post(ADDR_BUNDLER_NODES, sigResult)
            : null;
    }
    /**
     * Get traffic logs from gateway
     * @param path Gateway url
     * @returns Result as a promise
     */
    _getTrafficLogFromGateWay(path) {
        return axios_1.default.get(path);
    }
    /**
     *
     * @param gateWayUrl
     * @returns
     */
    async _storeTrafficLogOnArweave(gateWayUrl) {
        const trafficLogs = await this._getTrafficLogFromGateWay(gateWayUrl);
        return await this.postData(trafficLogs.data.summary);
    }
    /**
     * Read contract latest state
     * @param data Data to be hashed
     * @returns Hex string
     */
    async _hashData(data) {
        const dataInString = JSON.stringify(data);
        const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
        const hashBuffer = await common_1.arweave.crypto.hash(dataIn8Array);
        const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
        return hashHex;
    }
    /**
     * internal function, writes to contract. Overrides common._interactWrite, uses redis
     * @param input
     * @returns
     */
    async _interactWrite(input) {
        const redisClient = this.redisClient;
        const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
        if (this.redisClient !== null && this.redisClient !== undefined) {
            // Adding the dryRun logic
            let pendingStateArray = await redisGetAsync("pendingStateArray", redisClient);
            if (!pendingStateArray)
                pendingStateArray = [];
            else
                pendingStateArray = JSON.parse(pendingStateArray);
            // get leteststate
            // let latestContractState=await smartweave.readContract(arweave, KOI_CONTRACT)
            let latestContractState = await redisGetAsync("currentState", redisClient);
            latestContractState = JSON.parse(latestContractState);
            return new Promise(function (resolve, reject) {
                smartweave_1.smartweave
                    .interactWrite(common_1.arweave, wallet, common_1.KOI_CONTRACT, input)
                    .then(async (txId) => {
                    pendingStateArray.push({
                        status: "pending",
                        txId: txId,
                        input: input
                        // dryRunState:response.state,
                    });
                    await redisSetAsync("pendingStateArray", JSON.stringify(pendingStateArray), redisClient);
                    await recalculatePredictedState(wallet, latestContractState, redisClient);
                    resolve(txId);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
        else {
            return new Promise(function (resolve, reject) {
                smartweave_1.smartweave
                    .interactWrite(common_1.arweave, wallet, common_1.KOI_CONTRACT, input)
                    .then((txId) => {
                    resolve(txId);
                })
                    .catch((err) => {
                    reject(err);
                });
            });
        }
    }
}
exports.Node = Node;
function redisSetAsync(arg1, arg2, arg3) {
    const redisClient = arg3;
    return new Promise(function (resolve, _reject) {
        resolve(redisClient.set(arg1, arg2));
    });
    //return promisify(this.redisClient.set).bind(this.redisClient);
}
function redisGetAsync(arg1, arg2) {
    const redisClient = arg2;
    return new Promise(function (resolve, reject) {
        redisClient.get(arg1, (err, val) => {
            resolve(val);
            reject(err);
        });
    });
    // return promisify(this.redisClient.get).bind(this.redisClient);
}
/**
 * internal function, recalculatesThePredictedState based on the pending transactions
 * @param wallet
 * @param latestContractState
 * @param redisClient
 * @returns
 */
async function recalculatePredictedState(wallet, latestContractState, redisClient) {
    await checkPendingTransactionStatus(redisClient);
    let pendingStateArray = await redisGetAsync("pendingStateArray", redisClient);
    if (!pendingStateArray) {
        console.error("No pending state found");
        return;
    }
    pendingStateArray = JSON.parse(pendingStateArray);
    let finalState;
    const contract = await smartweave_1.smartweave.loadContract(common_1.arweave, common_1.KOI_CONTRACT);
    const from = await common_1.arweave.wallets.getAddress(wallet);
    for (let i = 0; i < pendingStateArray.length; i++) {
        console.log(`Pending Transaction ${i + 1}`, pendingStateArray[i]);
        if (i == 0) {
            console.time("Time this");
            finalState = await smartweave_1.smartweave.interactWriteDryRun(common_1.arweave, wallet, common_1.KOI_CONTRACT, pendingStateArray[i].input, latestContractState, from, contract);
            console.timeEnd("Time this");
        }
        else {
            console.time("Time this");
            finalState = await smartweave_1.smartweave.interactWriteDryRun(common_1.arweave, wallet, common_1.KOI_CONTRACT, pendingStateArray[i].input, finalState.state, from, contract);
            console.timeEnd("Time this");
        }
    }
    console.log("FINAL Predicted STATE", finalState);
    if (finalState)
        await redisSetAsync("predictedState", JSON.stringify(finalState), redisClient);
}
/**
 *
 * @param redisClient
 * @returns
 */
async function checkPendingTransactionStatus(redisClient) {
    let pendingStateArray = await redisGetAsync("pendingStateArray", redisClient);
    if (!pendingStateArray) {
        console.error("No pending state found");
        return;
    }
    pendingStateArray = JSON.parse(pendingStateArray);
    for (let i = 0; i < pendingStateArray.length; i++) {
        const arweaveTxStatus = await common_1.arweave.transactions.getStatus(pendingStateArray[i].txId);
        if (arweaveTxStatus.status != 202) {
            pendingStateArray[i].status = "Not pending";
        }
    }
    pendingStateArray = pendingStateArray.filter((e) => {
        return e.status == "pending";
    });
    await redisSetAsync("pendingStateArray", JSON.stringify(pendingStateArray), redisClient);
}
function getRedisClient() {
    let client = null;
    if (!process.env.REDIS_IP || !process.env.REDIS_PORT) {
        throw Error("CANNOT READ REDIS IP OR PORT FROM ENV");
    }
    else {
        client = redis_1.default.createClient({
            host: process.env.REDIS_IP,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD
        });
        client.on("error", function (error) {
            console.error(error);
        });
        client.on("connect", function () {
            console.log("connected to redis!!");
        });
    }
    return client;
}
module.exports = { Node };
//# sourceMappingURL=node.js.map