// this file contains a library for interacting with the Koi community contract
/*
    Supported Operations / TODO
    1. Add all standard PSC endpoints support
    2. Add wallet management support (wrapper on arweave library)
    3. Add wallet getBalance Support (fetch from permaweb, not contract interaction) X
    4. Upload data and store PST  (hit registerPermaWebData) X
    5. Creating Tasks and funding bounties (hit ) X
    6. Submitting data to tasks (and receiving rewards!) X
    7. Distributing daily KOI rewards (burn KOI to call distributeRewards)
    8. Participate in voting
    9. Approve Traffic Logs

*/
var __importStar = (this && this.__importStar) || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  return result;
};
const Arweave = require ('arweave/node')
const fs      = require('jsonfile')
const smartweave = require("smartweave");
const axios = require('axios');
const crypto = require('crypto');
const jwkToPem = require('jwk-to-pem');
//const _ = require('underscore');
const ArweaveUtils = __importStar(require("arweave/node/lib/utils"));

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443
});


const koi_contract = "RWl3bimVg0Kdlr3R2vbjjxilKaJQwMcmCZ6Ho7dkv0g";
// Do0Yg4vT9_OhjotAn-DI2J9ubkr8YmOpBg1Z8cBdLNA
// PfNmSoFfLr5xoL14D6qXy6Gb3HVWX9vI8yLuqDEQTjY
// const bundlerNodes = "http://localhost:8887/" 
const bundlerNodes = "http://bundler.openkoi.com:8887" // @abel - I have a gateway set up on this node, I think we can run the server there as well

class koi {

  constructor() {
    this.wallet = {}
    this.myBookmarks = [];
    this.totalVoted = -1;
  }

  /*
    @addToBookMarks // add txid to bookmarks 
    artxid : String, // arweave transaction id
    ref: ................?  
  */
  addToBookmarks(artxid, ref) {
    if ( typeof(this.myBookmarks[artxid]) != "undefined" ) {
        throw Error ('cannot assign a bookmark to ', artxid, ' since it already has a note ', ref)
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
  async loadWallet (walletFileLocation) {
    this.wallet = await loadFile(walletFileLocation)
    await this.getWalletAddress()
    console.log('loaded wallet from', walletFileLocation);
    return this.wallet;
  }

  /*
    @getWalletAddress // get walllet key address.
    Returns address as a string;
  */
  async getWalletAddress () {
    if (!this.address) this.address = await arweave.wallets.jwkToAddress(this.wallet)
    return this.address;
  }

  /*
    @getWalletBalance // gets wallet balance Note, this is arweave bakance, not kOI balance.
    Returns balance.
  */
  async getWalletBalance () {
    this.balance = await arweave.wallets.getBalance(this.address);
    return this.balance;
  }

  /*
    @postData // posts data on arweave.
    Returns transaction id.
    data: object // data
  */
  async postData (data) { // TODO: define data interface
    // var receivedData: object = {};
    // TODO hit registerPermaWebData in order to add received data to PermaWeb
    // TODO store returned PST

    // First we create the transaction
    const transaction = arweave.createTransaction({
        data: JSON.stringify(data)
    }, this.wallet);

    // Now we sign the transaction
    await arweave.transactions.sign(transaction, this.wallet);

    // After is signed, we send the transaction
    var tx = await arweave.transaction.post(transaction);

    console.log('tx', tx)

    // TODO - add to bookmarks here

    return tx;
  }
  


  /*
   @submitDataToTask // creates a koi task 
    submission : 
  */
  createTask (task, bounty){ // TODO:create task interface
    // TODO: create task id
    // TODO: store task, task id, and bounty in SmartWeave contract

    // this means nothing
    return {task, bounty};
  }

  /*
   @submitDataToTask // submits a valid payload for a koi task. 
    submission : 
  */
  submitDataToTask (submission) { // TODO: Create submission interface
    // TODO: pass submission from human or machine agent to SmartWeave contract
    // TODO: await rewards from SmartWeave contract and send them to human or machine
    var rewards = 0;

    // this means nothing
    return {rewards, submission};
  }

  /*
   @batchAction // Interact with contract to add the votes 
   Returns the transaction id. 
    txId : String, // the votes transaction id in arweave
  */
  async batchAction (txId){
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
    * @updateTrafficlogs //  interact with contract to update traffic logs and create new vote
    * Returns the transaction id. 
    * args : Object, // it has batchFile/(string) and stakeAmount/(int) as properties 
        // batchFile is the traffilc logs transaction id in arweave and stakeamount is min staked kOI to vote  
  */
  async updateTrafficlogs (args){
    let input = {
      "function": 'updateTrafficLogs',
      "batchTxId": args.batchFile,
      "stakeAmount": args.stakeAmount
    };
    let result = await this._interactWrite(input);
    return result;
  }
   


  /*
   @registerData //  interact with contract to register data
   Returns the transaction id. 
   param1 : txId, // it has batchFile/value(string) and stakeamount/value(int) as properties 
  */
  async registerData (txId){
    let input = {
      "function": 'registerData',
      "txId": txId
    };
    let result = await this._interactWrite(input);
    return result;
  }

   

  /*
   @registerData //  interact with contract to distribute daily rewards
   Returns the transaction id. 
  */
  async distributeDailyRewards () { 
    let input = {
      "function": 'distributeRewards',
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
    let userVote = await this.validateData();
    let input = {
      "function": 'vote',
      "voteId" : arg.voteId,
      "userVote" : userVote
    };
    var result;
    if(arg.direct === true){
      console.log(input);
      result = await  this._interactWrite(input)  

    }else{
      let caller = await this.getWalletAddress();
      let payload = {
        vote : input,
        senderAddress : caller
      }
      console.log(input);
      result = await this._bundlerNode(payload);
      console.log(result);
    }

    if(result){
      this.totalVoted = arg.voteId;
    }
    return result;
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
       "qty" : qty
    }

    let result = await this._interactWrite(input)
    console.log(result)
    console.log('done.....');
    return result;
  }
  
  /*
    @transfer //  interact with contract to transfer koi 
    Returns the transaction id. 
    qty : integer, //  quantity to transfer
    target : string, //  reciever address 
  */
  async transfer(qty,target){
    
    let input = {
      "function": 'transfer',
       "qty" : qty,
       "target": target
    };

    let result = await this._interactWrite(input)

    return result;

  }

  /*
    @withDraw //  interact with contract to transfer koi 
    Returns the transaction id. 
    qty : integer, //  quantity to transfer
    target : string, //  reciever address 
  */
  async withDraw(qty){
    
    let input = {
      "function": 'withdraw',
       "qty" : qty
       
    };

    let result = await this._interactWrite(input)

    return result;

  }





  async validateData() {
    
    // from the gate way 
   //let bundlerData = await this._getData(path);
  // get trafficlog from contract
   // let state = await this.getContractState();
   // let contractData = state.trafficLogs;
   // console.log(_.isEqual(bundlerData.data, contractData)); 
   
  // return _.isEqual(bundlerData, contractData);

  return true;

  }



  /*
    @verifySignature //  verify signed payload
    Returns boolean. // 
    payload : object, //  payload 
    
  */
  verifySignature (payload) { 
    const publicKey = {
      kty: "RSA",
      e: "AQAB",
      n: payload.owner
    };

    const pem = jwkToPem(publicKey);
    const rawSignature = ArweaveUtils.b64UrlToBuffer(payload.signature);
    
    const verify = crypto.createVerify('SHA256').update(JSON.stringify(payload.vote));
    
    return verify.verify(pem,rawSignature);
  }




  /*
   @signPayload: sign payload
   return: signed payload with signature.
     payload to sign
  */
  signPayload (payload) { 
    let jwk = this.wallet;
    let publicModulus = jwk.n;
    let pem = jwkToPem(jwk, { private: true });
  
    const rawSignature = crypto.createSign('SHA256').update(JSON.stringify(payload.vote)).sign(pem);
    payload.signature = ArweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }



  
  verifyAddress(publicKey){
    const bufferPublickey = ArweaveUtils.b64UrlToBuffer(publicKey);
    let rawAddress = crypto.createHash('SHA256').update(bufferPublickey).digest();
    let address = ArweaveUtils.bufferTob64Url(rawAddress);
    return address;
  }


  


  async getTransaction(id){
    let tran = await arweave.transactions.get(id); 
    return tran;
  }




  async getBlockheight(){
    let info = await this._getArweavenetInfo();
    //console.log(info);
    return info.data.height;
  }



  
  
  async _getArweavenetInfo(){
    return new Promise(function (resolve, reject){
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
   @_bundlerNode // internal function, submits a payload to server 
   Returns the result as a promise
   payload: // a payload to be submited. 
  */
  async _bundlerNode(payload){

    payload = this.signPayload(payload)

    return new Promise(function (resolve, reject){
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


  async _getData(path){

   
    return new Promise(function (resolve, reject){
          axios
            .get(bundlerNodes+path)
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
   @_interactWrite //  internal function, writes to contract
   Returns the a promise
   input: // Object, passes to smartweave write function, in order to excute a contract function.
  */
  async _interactWrite(input){
    let wallet = this.wallet;
    return new Promise(function (resolve, reject){
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
  async _readContract(){
    return new Promise(function (resolve, reject){
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





  async getContractState(){
    let state = await this._readContract();
    return state;
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
/*

runNode() {
  1. set wallet
  2. set stake (it not already set)
  3. check traffic logs
  4. submit vote
  5. verify vote was added to arweave (after 24 hrs)
}

*/