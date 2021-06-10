import dotenv from "dotenv";
dotenv.config();

import { Common, Vote, BundlerPayload, arweave } from "./common";
import { JWKInterface } from "arweave/node/lib/wallet";
import { readFile } from "fs/promises";
import Datastore from "nedb-promises";
import axios, { AxiosResponse } from "axios";
import * as arweaveUtils from "arweave/node/lib/utils";
import { smartweave } from "smartweave";
import redis, { RedisClient } from "redis";
import { Query } from "@kyve/query";

/*
Koi Node Operation: {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs (or other task data)
  4. submit vote to bundler server
  5. verify vote was added to arweave (after 24 hrs) 
}
*/

const URL_LOGS = "https://arweave.dev/logs";
const SERVICE_SUBMIT = "/submitVote";

export class Node extends Common {
  db?: Datastore;
  totalVoted = -1;
  receipts: Array<any> = [];
  redisClient?: RedisClient;

  /**
   * Asynchronously load a wallet from a UTF8 JSON file
   * @param file Path of the file to be loaded
   * @returns JSON representation of the object
   */
  async loadFile(file: string): Promise<any> {
    const data = await readFile(file, "utf8");
    return JSON.parse(data);
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
        totalVoted: -1,
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
    const userVote: any = await this.validateData(arg.voteId);
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

    let receipt;
    let tx;
    if (arg.direct) tx = await this._interactWrite(input);
    else {
      const caller = await this.getWalletAddress();

      // Vote must be a string when indirect voting through bundler
      input.userVote = userVote.toString();

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

    if (!receipt) return null;

    if (this.db !== undefined && receipt.status === 200) {
      if (receipt.data.message == "success") {
        this.totalVoted += 1;
        const data = receipt.data.receipt;
        const id = await this._db();
        await this.db.update({ _id: id }, { $push: { receipt: data } });
        this.receipts.push(data);
        return { message: "success" };
      } else if (receipt.data.message == "duplicate") {
        this.totalVoted += 1;
        await this._db();
        return { message: "duplicatedVote" };
      }
    } else {
      this.totalVoted += 1;
      await this._db();
      return { message: receipt.data.message };
    }

    // Status 200, but message doesn't match.
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
    const currentTrafficLogs =
      state.stateUpdate.trafficLogs.dailyTrafficLog.filter(
        (proposedLog: {
          block: number;
          proposedLogs: [];
          isRanked: boolean;
          isDistributed: boolean;
        }) => proposedLog.block == state.stateUpdate.trafficLogs.open
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

    const gatewayTrafficLogs = await this._getTrafficLogFromGateWay(URL_LOGS);
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

  /**
   * Loads redis client
   */
  loadRedisClient(): void {
    if (!process.env.REDIS_IP || !process.env.REDIS_PORT) {
      throw Error("CANNOT READ REDIS IP OR PORT FROM ENV");
    } else {
      this.redisClient = redis.createClient({
        host: process.env.REDIS_IP,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD
      });

      this.redisClient.on("error", function (error) {
        console.error("redisClient " + error);
      });
    }
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
    if (!redisClient) redisClient = this.redisClient;
    if (!latestContractState) latestContractState = await super._readContract();
    await checkPendingTransactionStatus(redisClient);
    let pendingStateArray = await redisGetAsync(
      "pendingStateArray",
      redisClient
    );
    if (!pendingStateArray) {
      console.error("No pending state found");
      return;
    }
    pendingStateArray = JSON.parse(pendingStateArray);
    let finalState: any;
    const contract: any = await smartweave.loadContract(
      arweave,
      this.contractId
    );
    const from = await arweave.wallets.getAddress(wallet);

    for (let i = 0; i < pendingStateArray.length; i++) {
      console.log(`Pending Transaction ${i + 1}`, pendingStateArray[i]);
      if (i == 0) {
        if (pendingStateArray[i].signedTx) {
          finalState = await this.registerDataDryRun(
            pendingStateArray[i].txId,
            pendingStateArray[i].owner,
            pendingStateArray[i].signedTx,
            latestContractState,
            contract
          );
          continue;
        }
        finalState = await smartweave.interactWriteDryRun(
          arweave,
          wallet,
          this.contractId,
          pendingStateArray[i].input,
          undefined,
          undefined,
          undefined,
          latestContractState,
          from,
          contract
        );
        break; //TODO: REMOVE THIS CODE
        // console.timeEnd("Time this");
      } else {
        // console.time("Time this");
        if (pendingStateArray[i].signedTx) {
          finalState = await this.registerDataDryRun(
            pendingStateArray[i].txId,
            pendingStateArray[i].owner,
            pendingStateArray[i].signedTx,
            finalState.state,
            contract
          );
          continue;
        }
        finalState = await smartweave.interactWriteDryRun(
          arweave,
          wallet,
          this.contractId,
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
    if (finalState.state)
      await redisSetAsync(
        "ContractPredictedState",
        JSON.stringify(finalState.state),
        redisClient
      );
  }

  /**
   * internal function, writes to contract. Used explictly for signed transaction received from UI, uses redis
   * @param txId
   * @param owner
   * @param tx
   * @param state
   * @returns
   */
  async registerDataDryRun(
    txId: any,
    owner: any,
    tx: any,
    state: any,
    contract: any
  ): Promise<any> {
    const input = {
      function: "registerData",
      txId: txId,
      owner: owner
    };
    const fromParam = await arweave.wallets.ownerToAddress(tx.owner);
    // let currentFinalPredictedState=await redisGetAsync("TempPredictedState")
    const finalState = await smartweave.interactWriteDryRunCustom(
      arweave,
      tx,
      this.contractId,
      input,
      state,
      fromParam,
      null
    );
    console.log(
      "Semi FINAL Predicted STATE for registerData",
      finalState.state ? finalState.state.registeredRecord : "NULL"
    );
    if (finalState.type != "exception") {
      await redisSetAsync(
        "ContractPredictedState",
        JSON.stringify(finalState.state),
        this.redisClient
      );
      return finalState;
    } else {
      console.error("EXCEPTION", finalState);
    }
    return state;
    // this._interactWrite(input)
  }

  // Protected functions

  /**
   * internal function, writes to contract. Overrides common._interactWrite, uses redis
   * @param input
   * @returns Transaction ID
   */
  protected async _interactWrite(input: any): Promise<string> {
    const wallet = this.wallet === undefined ? "use_wallet" : this.wallet;

    if (!this.redisClient)
      return smartweave.interactWrite(arweave, wallet, this.contractId, input);

    // Adding the dryRun logic
    let pendingStateArray = await redisGetAsync(
      "pendingStateArray",
      this.redisClient
    );
    if (!pendingStateArray) pendingStateArray = [];
    else pendingStateArray = JSON.parse(pendingStateArray);

    const latestContractState = await this._readContract();

    const txId = await smartweave.interactWrite(
      arweave,
      wallet,
      this.contractId,
      input
    );
    pendingStateArray.push({
      status: "pending",
      txId: txId,
      input: input
      // dryRunState:response.state,
    });
    await redisSetAsync(
      "pendingStateArray",
      JSON.stringify(pendingStateArray),
      this.redisClient
    );
    await this.recalculatePredictedState(
      wallet,
      latestContractState,
      this.redisClient
    );

    return txId;
  }

  /**
   * Read contract latest state
   * @returns Contract
   */
  protected async _readContract(): Promise<any> {
    if (this.redisClient) {
      // First Attempt to retrieve the ContractPredictedState from redis
      const state = await redisGetAsync(
        "ContractPredictedState",
        this.redisClient
      );
      const jsonState = JSON.parse(state);
      if (jsonState) {
        const balances = jsonState["balances"];
        if (balances !== undefined && balances !== null) return jsonState;
      }
    }

    // Second, get state from Kyve
    const poolID = 4;
    const query = new Query(poolID);
    // finding latest transactions
    try {
      const snapshotArray = await query.limit(1).find();
      if (snapshotArray && snapshotArray.length > 0)
        return JSON.parse(snapshotArray[0]).state;
      else console.log("NOTHING RETURNED FROM KYVE");
    } catch (e) {
      console.log("ERROR RETRIEVING FROM KYVE", e);
    }

    // Next Attempt to retrieve ContractCurrentState from redis (Stored when data was successfully retrieved from KYVE)
    if (this.redisClient) {
      const state = await redisGetAsync(
        "ContractCurrentState",
        this.redisClient
      );
      const jsonState = JSON.parse(state);
      if (jsonState) {
        const balances = jsonState["balances"];
        if (balances !== undefined && balances !== null) return jsonState;
      }
    }

    // Fallback to smartweave
    return smartweave.readContract(arweave, this.contractId);
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
      ? await axios.post(this.bundlerUrl + SERVICE_SUBMIT, sigResult)
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

module.exports = { Node };
