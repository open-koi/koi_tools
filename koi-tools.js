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
  if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
const Arweave = require ('arweave/node')
const fs      = require('jsonfile')
const smartweave_1 = require("smartweave");
const axios = require('axios');
const crypto = require('crypto');
const jwkToPem = require('jwk-to-pem');
const ArweaveUtils = __importStar(require("./node_modules/arweave/node/lib/utils.js"));

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443
});

const koi_contract = "Do0Yg4vT9_OhjotAn-DI2J9ubkr8YmOpBg1Z8cBdLNA";
const bundlerNodes = "http://bundler.openkoi.com:3000/" 

class koi {

  constructor() {
    this.wallet = {}
    this.myBookmarks = [];
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
      // console.log(this.wallet);
      console.log('wallet loaded successfully from', walletFileLocation)
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
    @getKoiBalance // this is the Koi balance
  */

  async getKoiBalance (address) {
    console.log('getKoiBalanceTriggered ', address)
    
    if ( !this.state ) {
      this.state = await this.getContractState()
    } 

    if ( !this.state.balances[address] ) {
      return 0;
    } else {
      return this.state.balances[address];
    }

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
  


  createTask (task, bounty){ // TODO:create task interface
    // TODO: create task id
    // TODO: store task, task id, and bounty in SmartWeave contract
  }
  


  submitDataToTask (submission) { // TODO: Create submission interface
    // TODO: pass submission from human or machine agent to SmartWeave contract
    // TODO: await rewards from SmartWeave contract and send them to human or machine
    var rewards = 0;
    return rewards;
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
      "txId": txId
     };

     // interact with contract function batchAction which adds all votes and update the state
    let result = await _interactWrite(input);
     return result;
   }




   
   /*
   @upadteTrafficlogs //  interact with contract to update traffic logs and create new vote
   Returns the transaction id. 
   args : Object, // it has batchFile/(string) and stakeAmount/(int) as properties 
    // batchFile is the traffilc logs transaction id in arweave and stakeamount is min staked kOI to vote  
  */




   async updateTrafficlogs (args){
       let input = {
          "function": 'updateTrafficlogs',
          "batchTxId": args.batchFile,
          "stakeAmount": args.stakeAmount
       };
      let result = await _interactWrite(input);
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
    let result = await _interactWrite(input);
     return result;
  }

  

  /*
   @vote //  submit vote to bundle server or direct to contract
   Returns the transaction id. 
   arg : Object, // it has direct(boolean),  voteId(string) and useVote(String)
  */
  

  async vote(arg) { 
    let input = {
      "function": 'vote',
      "voteId" : arg.voteId,
      "userVote" : arg.userVote
    };
    let result;
    if(arg.direct === true){
      console.log(input);
    result = await  this._interactWrite(input)  

   }else{
    let caller = await this.getWalletAddress();
    let payload = {
      vote : input,
      senderAddress : caller,
     }
     console.log(input);
       result = await this._bundlerNode(payload);
    }
    return result;
  }


  /*
   @stake //  interact with contract to stake
   Returns the transaction id. 
   qty : integer, //  quantity to stake
  */

  

  async stake(qty) { 
   
    if (!Number.isInteger(qty)) {
      throw Error('Invalid value for "qty". Must be an integer');
  }

    var input = {
      "function": 'stake',
       "qty" : qty
    }

    let result = await this._interactWrite(input)

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

    let result = await _interactWrite(input)

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

    let result = await _interactWrite(input)

    return result;

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
    console.log(jwk.n);
    let publicModulus = jwk.n;
    let pem = jwkToPem(jwk, { private: true });
  
    const rawSignature = crypto.createSign('SHA256').update(JSON.stringify(payload.vote)).sign(pem);
    payload.signature = ArweaveUtils.bufferTob64Url(rawSignature);
    payload.owner = publicModulus;
    return payload;
  }


  verifyAddress(publicKey){
    const bufferPublickey = Buffer.from(publicKey, 'base64');
    let rawAddress = crypto.createHash('SHA256').update(bufferPublickey).digest();
   let address = ArweaveUtils.bufferTob64Url(rawAddress);
    return address;
  }




    
  /*
   @_bundlerNode // internal function, submits a playload to server 
   Returns the a promise
   payload: // a payload to be submited. 
 */



  async _bundlerNode(payload){

    payload = this.signPayload(payload)
    return new Promise(function (resolve, reject){
          axios
            .post(bundlerNodes, payload)
            .then(res => {
              console.log(`statusCode: ${res.statusCode}`)
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
            smartweave_1.interactWrite(
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
       smartweave_1.readContract(
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

 this.state = await this._readContract();
 return this.state;

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