
var __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  return result;
};
const Arweave = require('arweave/node')
const fs = require('jsonfile')
const smartweave = require("smartweave");
const axios = require('axios');
const _ = require('underscore');
const ArweaveUtils = __importStar(require("arweave/node/lib/utils"));

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443
});


const koi_contract = "Ar1RAJDSAJdAGCI22nkAveDbtgtcMx1bNXopk2pfENs";
const bundlerNodes = "http://bundler.openkoi.com:8887"
class koi {

  constructor() {
    this.wallet = {}
    this.myBookmarks = [];
    this.totalVoted = -1;
    this.reciepts = [];
  }


  /*
    @addToBookMarks // add txid to bookmarks 
    artxid : String, // arweave transaction id
    ref: ................?  
  */
  addToBookmarks(artxid, ref) {
    if (typeof (this.myBookmarks[artxid]) != "undefined") {
      throw Error('cannot assign a bookmark to ', artxid, ' since it already has a note ', ref)
    } else {
      this.myBookmarks[artxid] = ref
      this.myBookmarks[ref] = artxid
    }
  }

  /*
    @loadWallet // loads wallet key from file path.
    Returns the key as an object.
    walletFileLocation: // wallet key file loaction
  */
  async loadWallet(walletFileLocation) {
    this.wallet = await loadFile(walletFileLocation)
    await this.getWalletAddress()
    console.log('loaded wallet from', walletFileLocation);
    return this.wallet;
  }


  /*
    @setWallet // set address .
    Returns address
    walletAddress: string // arweave address
  */
 async setWallet(walletAddress) {
  if (!this.address) this.address = walletAddress;
  return this.address;
}

  /*
    @getWalletAddress // get walllet key address.
    Returns address as a string;
  */
  async getWalletAddress() {
    if (!this.address) this.address = await arweave.wallets.jwkToAddress(this.wallet)
    return this.address;
  }

  /*
    @getWalletBalance // gets wallet balance Note, this is arweave bakance, not kOI balance.
    Returns balance.
  */
  async getWalletBalance() {
    this.balance = await arweave.wallets.getBalance(this.address);
    return this.balance;
  }

  /*
   @getWalletBalance // gets wallet balance Note, this is arweave bakance, not kOI balance.
   Returns balance.
 */
  async getKoiBalance() {

    let state = await this.getContractState();
    if (!(this.address in state.balances)) {
      return 0;
    }
    let koiBalance = state.balances[this.address];
    return koiBalance;
  }

   /*
    @stake //  interact with contract to stake
    Returns the transaction id. 
    qty : integer, //  quantity to stake
   */
  async stake(qty) {
    console.log('starting.....');
    if (!Number.isInteger(qty)) {
      throw Error('Invalid value for "qty". Must be an integer');
    }
    var input = {
      "function": 'stake',
      "qty": qty
    }

    let result = await this._interactWrite(input);
    return result;
  }


  /*
      @withDraw //  interact with contract to transfer koi 
      Returns the transaction id. 
      qty : integer, //  quantity to transfer
      target : string, //  reciever address 
    */
  async withDraw(qty) {
    if (!Number.isInteger(qty)) {
      throw Error('Invalid value for "qty". Must be an integer');
    }
    let input = {
      "function": 'withdraw',
      "qty": qty

    };

    let result = await this._interactWrite(input)

    return result;

  }


  /*
      @transfer //  interact with contract to transfer koi 
      Returns the transaction id. 
      qty : integer, //  quantity to transfer
      target : string, //  reciever address 
    */
  async transfer(qty, target) {

    let input = {
      "function": 'transfer',
      "qty": qty,
      "target": target
    };

    let result = await this._interactWrite(input)

    return result;

  }


  /*
     @registerData //  interact with contract to register data
     Returns the transaction id. 
     param1 : txId, // it has batchFile/value(string) and stakeamount/value(int) as properties 
    */
  async registerData(txId) {
    let input = {
      "function": 'registerData',
      "txId": txId
    };
    let result = await this._interactWrite(input);
    return result;
  }


  /*
     @vote //  submit vote to bundle server or direct to contract
     Returns the transaction id. 
     arg : Object, // it has direct(boolean),  voteId(string) and useVote(String)
    */
  async vote(arg) {
    let userVote = await this.validateData(arg.voteId);
    let input = {
      "function": 'vote',
      "voteId": arg.voteId,
      "userVote": userVote
    };
    var reciept;
    var tx;
    if (arg.direct === true) {
      console.log(input);
      tx = await this._interactWrite(input)

    } else {
      let caller = await this.getWalletAddress();
      let payload = {
        vote: input,
        senderAddress: caller
      }
      console.log(input);
      reciept = await this._bundlerNode(payload);

      console.log(reciept);
    }

    if (reciept) {
      this.totalVoted += 1;
      this.reciepts.push(reciept);
      return reciept;
    }

    if (tx) {
      this.totalVoted += 1;
      return tx;
    }
    return null;
  }




  /*
      @submitTrafficLog //  propose a tafficlog for vote 
      Returns tx 
      arg// object arg.gateway(trafficlog orginal gateway id)
            and arg.stakeAmount(min required stake to vote) 
    */
  async submitTrafficLog(arg) {

    let TLTxId = await this._storeTrafficlogOnArweave(arg.gateWayUrl);

    let input = {
      "function": 'submitTrafficLog',
      "gateWayUrl": arg.gateWayUrl,
      "batchTxId": TLTxId,
      "stakeAmount": arg.stakeAmount
    };
    let tx = await this._interactWrite(input);

    return tx;

  }

  /*
  @rankProposal //  rank proposed trafficlogs
  Returns tx 
  */
  async rankProposal() {
    let input = {
      "function": 'rankProposal'
    }
    let tx = await this._interactWrite(input);

    return tx;

  }

  /*
   @batchAction // Interact with contract to add the votes 
   Returns the transaction id. 
    txId : String, // the votes transaction id in arweave
  */
  async batchAction(txId) {
    // input object that pass to contract
    let input = {
      "function": 'batchAction',
      "batchFile": txId
    };

    // interact with contract function batchAction which adds all votes and update the state
    let result = await this._interactWrite(input);
    return result;
  }


  /*
   @proposeSlash //  propose a stake slashing 
  */
  async proposeSlash() {
    const state = await this.getContractState();
    const votes = state.votes;
    for (let i; i < this.reciepts.length - 1; i++) {
      let element = this.reciepts[i];
      let voteId = element.vote.vote.voteId;
      let vote = votes[voteId];
      if (!vote.voted.includes(this.wallet)) {
        let input = {
          function: "proposeSlash",
          reciept: element
        }
        await this._interactWrite(input);

      }

    }

    return null;

  }


  /*
   @distributeDailyRewards //  interact with contract to distribute daily rewards
   Returns the transaction id. 
  */
  async distributeDailyRewards() {
    let input = {
      "function": 'distributeRewards',
    };
    let result = await this._interactWrite(input);
    return result;
  }

  /*
    @mint //  mint koi
    Returns tx 
    arg// object arg.targetAddress(reciever address) and arg.qty(amount to mint)
  */
  async mint(arg) {
    let input = {
      "function": 'mint',
      "target": arg.targetAddress,
      "qty": arg.qty

    }
    let tx = await this._interactWrite(input);

    return tx;

  }

  /*
     @signPayload: sign payload
     return: signed payload with signature.
       payload to sign
    */
  async signPayload(payload) {
    let jwk = this.wallet;
    let publicModulus = jwk.n;
    const dataInString = JSON.stringify(payload.vote);
    const dataIn8Array = ArweaveUtils.stringToBuffer(dataInString);
    const rawSignature = await arweave.crypto.sign(jwk, dataIn8Array);
    payload.signature = ArweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }


  /*
    @verifySignature //  verify signed payload
    Returns boolean. // 
    payload : object, //  payload 
    
  */
  async verifySignature(payload) {
    const rawSignature = ArweaveUtils.b64UrlToBuffer(payload.signature);
    const dataInString = JSON.stringify(payload.vote);
    const dataIn8Array = ArweaveUtils.stringToBuffer(dataInString);
    const valid = await arweave.crypto.verify(payload.owner, dataIn8Array, rawSignature);
    return valid;
  }


  /*
   @contentView //  calaculate totalview and total rewards for content
   Returns: object //  
  txId : string, // content tx id
   
 */
  async contentView(txId) {
    const state = await this.getContractState();
    const rewardReport = state.stateUpdate.trafficLogs.rewardReport;
    let contentSummary = {};
    rewardReport.forEach(ele => {

      if (txId in ele.logSummary) {
        const rewardPerAttention = ele.rewardPerAttention;
        contentSummary['totalViews'] += ele.logSummary[txId];
        contentSummary['totalReward'] += contentSummary['totalViews'] * rewardPerAttention;
        if (rewardReport.indexOf(ele) == rewardReport.length - 1) {
          contentSummary['twentyFourHrViews'] = ele.logSummary[txId];
        }
      }



    });
    return contentSummary;
  }

  //----------------------------------------------------------------------------------------------------------------------------------
  /*
       @getContractState //  get contract state
      Returns state object
    */
  async getContractState() {
    let state = await this._readContract();
    return state;
  }

  /*
  @getTransaction //  get contract state
  Returns state object
  */
  async getTransaction(id) {
    let transaction = await arweave.transactions.get(id);
    return transaction;
  }

  /*
  @etBlockheight //  get current blockheight 
  Returns int// block height
  */
  async getBlockheight() {
    let info = await getArweavenetInfo();
    //console.log(info);
    return info.data.height;
  }



  //--------------------------------------------------------------------------------------------------------------------------------------
  /*
 @_interactWrite //  internal function, writes to contract
 Returns the a promise
 input: // Object, passes to smartweave write function, in order to excute a contract function.
*/
  async _interactWrite(input) {
    let wallet = this.wallet;
    //console.log();
    return new Promise(function (resolve, reject) {
      smartweave.interactWrite(
        arweave,
        wallet,
        koi_contract,
        input
      ).then((txId) => {
        resolve(txId);
      })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /*
   @_readContract //  internal function, read contract latest state
   Returns the a promise
 */
  async _readContract() {
    return new Promise(function (resolve, reject) {
      smartweave.readContract(
        arweave,
        koi_contract,
      ).then((state) => {
        resolve(state);
      })
        .catch((err) => {
          reject(err);
        });
    });
  }


  /*
    @_bundlerNode // internal function, submits a payload to server 
    Returns the result as a promise
    payload: // a payload to be submited. 
   */
  async _bundlerNode(payload) {

    payload = this.signPayload(payload)

    return new Promise(function (resolve) {
      console.log('entered bundler submission')
      axios
        .post(bundlerNodes, payload)
        .then(res => {
          console.log(`statusCode: ${res.statusCode}`)
          console.log(res)
          resolve(res);
        })
        .catch(error => {
          // console.log(error)
          resolve(error);
        })

    });

  }

  /*
    @ _getTrafficLogFromGateWay // get trafficllogs from gateway 
    Returns the result as a promise
    path: // a gateway url 
   */
  async _getTrafficLogFromGateWay(path) {
    return new Promise(function (resolve, reject) {
      axios
        .get(path)
        .then(res => {
          // console.log(`statusCode: ${res.statusCode}`)
          // console.log(res)
          resolve(res);
        })
        .catch(error => {
          // console.log(error)
          reject(error);
        })


    });

  }


  /*
    @_storeTrafficlogOnArweave // submit trafficlog to arweave 
    Returns: // tx id
    gatewayUrl: // a gateway url 
   */
  async _storeTrafficlogOnArweave(gateWayUrl) {
    let trafficLogs = await this._getTrafficLogFromGateWay(gateWayUrl);
    let tx = await this.postData(trafficLogs);

    return tx;

  }

  /*
    @validateData // validate trafficlog by comparing trafficlog from gateway and arweave storage 
    Returns boolean:// 
   voteId: // vote id which is belongs for specific proposalLog
   */
  async validateData(voteId) {
    const state = await this.getContractState();
    const trafficLogs = state.stateUpdate.trafficLogs;
    const currentTrafficLogs = trafficLogs.dailyTrafficLog.find(trafficlog => trafficlog.block === trafficLogs.open);
    const proposedLogs = currentTrafficLogs.proposedLogs;
    let proposedLog;
    proposedLogs.forEach(element => {
      if (element.voteId === voteId) {
        proposedLog = element;
      }
    });
    let gateWayUrl = proposedLog.gatWayId;
    let gatewayTrafficLogs = await this._getTrafficLogFromGateWay(gateWayUrl);
    let bundledTrafficLogs = await arweave.transactions.getData(proposedLog.TLTxId, { decode: true, string: true });


    return _.isEqual(gatewayTrafficLogs, bundledTrafficLogs);

  }

  /*
      @postData // posts data on arweave.
      Returns transaction id.
      data: object // data
    */
  async postData(data) { // TODO: define data interface
    let wallet = this.wallet;
    console.log(wallet);
    const transaction = await arweave.createTransaction({
      // eslint-disable-next-line no-undef
      data: Buffer.from(data, 'utf8')
    }, wallet);
    console.log(transaction);
    // Now we sign the transaction
    await arweave.transactions.sign(transaction, wallet);

    // After is signed, we send the transaction
    var tx = await arweave.transactions.post(transaction);

    console.log('tx', tx)


    return tx;
  }





}




module.exports = koi;

async function loadFile(fileName) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName)
      .then((file) => {
        resolve(file);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function getArweavenetInfo() {
  return new Promise(function (resolve, reject) {
    axios
      .get('https://arweave.net/info')
      .then(res => {
        // console.log(`statusCode: ${res.statusCode}`)
        // console.log(res)
        resolve(res);
      })
      .catch(error => {
        console.log(error)
        reject(error);
      })


  });
}


/*

runNode() {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs
  4. submit vote
  5. verify vote was added to arweave (after 24 hrs)
}

*/