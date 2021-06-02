import dotenv from "dotenv";
dotenv.config();

import {
  Common,
  Vote,
  BundlerPayload,
  arweave,
  ADDR_BUNDLER,
  ADDR_BUNDLER_CURRENT,
  KOI_CONTRACT,
  getCacheData
} from "./common";
import { JWKInterface } from "arweave/node/lib/wallet";
import * as fs from "fs";
import Datastore from "nedb-promises";
import axios, { AxiosResponse } from "axios";
import * as arweaveUtils from "arweave/node/lib/utils";
import { smartweave } from "smartweave";
import redis, { RedisClient } from "redis";

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
const ADDR_BUNDLER_NODES = ADDR_BUNDLER + "/submitVote/";

export class Node extends Common {
  db?: Datastore;
  totalVoted = -1;
  receipts: Array<any> = [];
  redisClient: RedisClient;

  constructor() {
    super();
    this.redisClient = getRedisClient();
  }

  /**
   * Asynchronously load a wallet from a UTF8 JSON file
   * @param file Path of the file to be loaded
   * @returns JSON representation of the object
   */
  loadFile(file: string): Promise<any> {
    return new Promise(function (resolve, reject) {
      fs.readFile(file, "utf8", (err: Error | null, data: string) => {
        if (err !== null) reject(err);
        resolve(JSON.parse(data));
      });
    });
  }

  /**
   * Loads wallet for node Simulator key from file path and initialize ndb.
   * @param walletFileLocation Wallet key file location
   * @returns Key as an object
   */
  async nodeLoadWallet(
    walletFileLocation: string
  ): Promise<JWKInterface | undefined> {
    const jwk = await this.loadFile(walletFileLocation);
    await this.loadWallet(jwk);
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
      const data: Array<any> = await this.db.find({});
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
   * propose a tafficLog for vote
   * @param arg
   * @returns object arg.gateway(trafficlog orginal gateway id) and arg.stakeAmount(min required stake to vote)
   */
  async submitTrafficLog(arg: any): Promise<string> {
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
  rankProposal(): Promise<string> {
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
  batchAction(arg: any): Promise<string> {
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
  async proposeSlash(): Promise<void> {
    const state = await this.getContractState();
    const votes = state.votes;
    const currentTrafficLogs = state.stateUpdate.dailyTrafficLog.filter(
      (proposedLog: {
        block: number;
        proposedLogs: [];
        isRanked: boolean;
        isDistributed: boolean;
      }) => proposedLog.block == state.stateUpdate.tracficLogs.open
    );
    for (const proposedLogs of currentTrafficLogs) {
      const currentProposedLogsVoteId = proposedLogs.voteId;
      for (let i = 0; i < this.receipts.length - 1; i++) {
        if (this.receipts[i].vote.vote.voteId === currentProposedLogsVoteId) {
          const vote = votes[currentProposedLogsVoteId];
          if (!vote.voted.includes(this.wallet)) {
            const input = {
              function: "proposeSlash",
              receipt: this.receipts[i]
            };
            await this._interactWrite(input);
          }
        }
      }
    }
  }

  /**
   *
   * @returns
   */
  async distributeDailyRewards(): Promise<string> {
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
  async validateData(voteId: number): Promise<boolean | null> {
    const state: any = await this.getContractState();
    const trafficLogs = state.stateUpdate.trafficLogs;
    const currentTrafficLogs = trafficLogs.dailyTrafficLog.find(
      (trafficLog: any) => trafficLog.block === trafficLogs.open
    );
    const proposedLogs = currentTrafficLogs.proposedLogs;
    const proposedLog = proposedLogs.find((log: any) => log.voteId === voteId);
    // lets assume we have one gateway id for now.
    //let gateWayUrl = proposedLog.gatWayId;

    if (proposedLog === undefined) return null;

    const gatewayTrafficLogs = await this._getTrafficLogFromGateWay(ADDR_LOGS);
    const gatewayTrafficLogsHash = await this._hashData(
      gatewayTrafficLogs.data.summary
    );

    const bundledTrafficLogs = (await arweave.transactions.getData(
      proposedLog.TLTxId,
      { decode: true, string: true }
    )) as string;

    const bundledTrafficLogsParsed = JSON.parse(bundledTrafficLogs);
    const bundledTrafficLogsParsedHash = await this._hashData(
      bundledTrafficLogsParsed
    );

    return gatewayTrafficLogsHash === bundledTrafficLogsParsedHash;
  }

  // Private functions

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

  /**
   * Get traffic logs from gateway
   * @param path Gateway url
   * @returns Result as a promise
   */
  private _getTrafficLogFromGateWay(path: string): Promise<any> {
    return axios.get(path);
  }

  /**
   *
   * @param gateWayUrl
   * @returns
   */
  private async _storeTrafficLogOnArweave(
    gateWayUrl: string
  ): Promise<string | null> {
    const trafficLogs = await this._getTrafficLogFromGateWay(gateWayUrl);
    return await this.postData(trafficLogs.data.summary);
  }

  /**
   * Read contract latest state
   * @param data Data to be hashed
   * @returns Hex string
   */
  private async _hashData(data: any): Promise<string> {
    const dataInString = JSON.stringify(data);
    const dataIn8Array = arweaveUtils.stringToBuffer(dataInString);
    const hashBuffer = await arweave.crypto.hash(dataIn8Array);
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
  protected async _interactWrite(input: any): Promise<string> {
    const redisClient = this.redisClient;

    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;
    if (this.redisClient !== null && this.redisClient !== undefined) {
      // Adding the dryRun logic
      let pendingStateArray = await redisGetAsync(
        "pendingStateArray",
        redisClient
      );
      if (!pendingStateArray) pendingStateArray = [];
      else pendingStateArray = JSON.parse(pendingStateArray);
      // get leteststate
      // let latestContractState=await smartweave.readContract(arweave, KOI_CONTRACT)
      let latestContractState = await redisGetAsync(
        "currentState",
        redisClient
      );
      latestContractState = JSON.parse(latestContractState);

      return new Promise(function (resolve, reject) {
        smartweave
          .interactWrite(arweave, wallet, KOI_CONTRACT, input)
          .then(async function (this:any,txId: any) {
            pendingStateArray.push({
              status: "pending",
              txId: txId,
              input: input
              // dryRunState:response.state,
            });

            await redisSetAsync(
              "pendingStateArray",
              JSON.stringify(pendingStateArray),
              redisClient
            );
            await this.recalculatePredictedState(
              wallet,
              latestContractState,
              redisClient
            );

            resolve(txId);
          })
          .catch((err: any) => {
            reject(err);
          });
      });
    } else {
      return new Promise(function (resolve, reject) {
        smartweave
          .interactWrite(arweave, wallet, KOI_CONTRACT, input)
          .then((txId: string) => {
            resolve(txId);
          })
          .catch((err: string) => {
            reject(err);
          });
      });
    }
  }

  /**
   * internal function, writes to contract. Used explictly for signed transaction received from UI, uses redis
   * @param txId
   * @param owner
   * @param tx
   * @param state
   * @returns
   */
  async registerDataDryRun(txId: any, owner: any, tx: any, state: any): Promise<any> {
    console.log("I AM CALLED")
    let input = {
      function: 'registerData',
      txId: txId,
      owner: owner,
    };
    let fromParam = await arweave.wallets.ownerToAddress(tx.owner);
    // let currentFinalPredictedState=await redisGetAsync("TempPredictedState")
    let finalState = await smartweave.interactWriteDryRunCustom(
      arweave,
      tx,
      KOI_CONTRACT,
      input,
      state,
      fromParam,
      null
    );
    console.log('Semi FINAL Predicted STATE for registerData', finalState.state ? finalState.state.registeredRecord : "NULL");
    if (finalState.type != 'exception') {
      await redisSetAsync('TempPredictedState', JSON.stringify(finalState),this.redisClient);
      return finalState;
    } else {
      console.error("EXCEPTION", finalState)
    }
    return state
    // this._interactWrite(input)
  }
  /**
 * internal function, recalculatesThePredictedState based on the pending transactions
 * @param wallet
 * @param latestContractState
 * @param redisClient
 * @returns
 */
  async recalculatePredictedState(
    wallet: any,
    latestContractState: any,
    redisClient: any
  ): Promise<any> {
    await checkPendingTransactionStatus(redisClient);
    let pendingStateArray = await redisGetAsync("pendingStateArray", redisClient);
    if (!pendingStateArray) {
      console.error("No pending state found");
      return;
    }
    pendingStateArray = JSON.parse(pendingStateArray);
    let finalState: any;
    const contract: any = await smartweave.loadContract(arweave, KOI_CONTRACT);
    const from = await arweave.wallets.getAddress(wallet);

    for (let i = 0; i < pendingStateArray.length; i++) {
      console.log(`Pending Transaction ${i + 1}`, pendingStateArray[i]);

      if (i == 0) {
        if (pendingStateArray[i].signedTx) {
          finalState = await this.registerDataDryRun(pendingStateArray[i].txId, pendingStateArray[i].owner, pendingStateArray[i].signedTx, null)
          continue
        }
        finalState = await smartweave.interactWriteDryRun(
          arweave,
          wallet,
          KOI_CONTRACT,
          pendingStateArray[i].input,
          undefined,
          undefined,
          undefined,
          latestContractState,
          from,
          contract
        );
        // console.timeEnd("Time this");
      } else {
        // console.time("Time this");
        if (pendingStateArray[i].signedTx) {
          finalState = await this.registerDataDryRun(pendingStateArray[i].txId, pendingStateArray[i].owner, pendingStateArray[i].signedTx, finalState.state)
          continue
        }
        finalState = await smartweave.interactWriteDryRun(
          arweave,
          wallet,
          KOI_CONTRACT,
          pendingStateArray[i].input,
          undefined,
          undefined,
          undefined,
          finalState.state,
          from,
          contract
        );
        // console.timeEnd("Time this");
      }
    }
    console.log("FINAL Predicted STATE", finalState);
    if (finalState)
      await redisSetAsync(
        "predictedState",
        JSON.stringify(finalState),
        redisClient
      );
  }

}

function redisSetAsync(arg1: any, arg2: any, arg3: any): Promise<any> {
  const redisClient = arg3;
  return new Promise(function (resolve, _reject) {
    resolve(redisClient.set(arg1, arg2));
  });
  //return promisify(this.redisClient.set).bind(this.redisClient);
}

function redisGetAsync(arg1: any, arg2: any): Promise<any> {
  const redisClient = arg2;
  return new Promise(function (resolve, reject) {
    redisClient.get(arg1, (err: any, val: any) => {
      resolve(val);
      reject(err);
    });
  });
  // return promisify(this.redisClient.get).bind(this.redisClient);
}


/**
 *
 * @param redisClient
 * @returns
 */
async function checkPendingTransactionStatus(redisClient: any): Promise<any> {
  let pendingStateArray = await redisGetAsync("pendingStateArray", redisClient);
  if (!pendingStateArray) {
    console.error("No pending state found");
    return;
  }
  pendingStateArray = JSON.parse(pendingStateArray);
  for (let i = 0; i < pendingStateArray.length; i++) {
    const arweaveTxStatus = await arweave.transactions.getStatus(
      pendingStateArray[i].txId
    );
    if (arweaveTxStatus.status != 202) {
      pendingStateArray[i].status = "Not pending";
    }
  }
  pendingStateArray = pendingStateArray.filter((e: any) => {
    return e.status == "pending";
  });
  await redisSetAsync(
    "pendingStateArray",
    JSON.stringify(pendingStateArray),
    redisClient
  );
}

function getRedisClient(): RedisClient {
  let client = null;
  if (!process.env.REDIS_IP || !process.env.REDIS_PORT) {
    throw Error("CANNOT READ REDIS IP OR PORT FROM ENV");
  } else {
    client = redis.createClient({
      host: process.env.REDIS_IP,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD
    });

    client.on("error", function (error) {
      console.error(error);
    });
  }
  return client;
}

module.exports = { Node };
