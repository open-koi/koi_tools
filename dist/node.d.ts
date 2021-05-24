import { Common, Vote } from "./common";
import { JWKInterface } from "arweave/node/lib/wallet";
import Datastore from "nedb-promises";
import { RedisClient } from "redis";
export declare class Node extends Common {
    db?: Datastore;
    totalVoted: number;
    receipts: Array<any>;
    redisClient: RedisClient;
    constructor();
    /**
     * Asynchronously load a wallet from a UTF8 JSON file
     * @param file Path of the file to be loaded
     * @returns JSON representation of the object
     */
    loadFile(file: string): Promise<any>;
    /**
     * Loads wallet for node Simulator key from file path and initialize ndb.
     * @param walletFileLocation Wallet key file location
     * @returns Key as an object
     */
    nodeLoadWallet(walletFileLocation: string): Promise<JWKInterface | undefined>;
    /**
     * Submit vote to bundle server or direct to contract
     * @param arg Object with direct, voteId, and useVote
     * @returns Transaction ID
     */
    vote(arg: Vote): Promise<any>;
    /**
     * propose a tafficLog for vote
     * @param arg
     * @returns object arg.gateway(trafficlog orginal gateway id) and arg.stakeAmount(min required stake to vote)
     */
    submitTrafficLog(arg: any): Promise<string>;
    /**
     *
     * @returns
     */
    rankProposal(): Promise<string>;
    /**
     * Interact with contract to add the votes
     * @param arg
     * @returns Transaction ID
     */
    batchAction(arg: any): Promise<string>;
    /**
     * Propose a stake slashing
     * @returns
     */
    proposeSlash(): Promise<void>;
    /**
     *
     * @returns
     */
    distributeDailyRewards(): Promise<string>;
    /**
     * Validate trafficlog by comparing traffic log from gateway and arweave storage
     * @param voteId Vote id which is belongs for specific proposalLog
     * @returns Whether data is valid
     */
    validateData(voteId: string): Promise<boolean | null>;
    /**
     * Read the data and update
     * @returns Database document ID
     */
    private _db;
    /**
     * Submits a payload to server
     * @param payload Payload to be submitted
     * @returns Result as a promise
     */
    private _bundlerNode;
    /**
     * Get traffic logs from gateway
     * @param path Gateway url
     * @returns Result as a promise
     */
    private _getTrafficLogFromGateWay;
    /**
     *
     * @param gateWayUrl
     * @returns
     */
    private _storeTrafficLogOnArweave;
    /**
     * Read contract latest state
     * @param data Data to be hashed
     * @returns Hex string
     */
    private _hashData;
    /**
     * internal function, writes to contract. Overrides common._interactWrite, uses redis
     * @param input
     * @returns
     */
    protected _interactWrite(input: any): Promise<string>;
}
