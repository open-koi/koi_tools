// tests koi-tools.js
//require("dotenv").config();
const { koi_tools } = require("../index.js");
var ktools = new koi_tools();
/*
const Arweave = require("arweave/node");
const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});
*/

//var walletKeyLocation = process.env.WALLET_LOCATION;
var walletKeyLocation = 'c:/Users/sebha/Desktop/koi/NFT-bridge/src/keywallet.json';
start();

async function start() {
  console.log("running async block", ktools);

  await ktools.loadWallet(walletKeyLocation);

  try {
    // await testMint()
    // test passed
     //  await testPostData();
    // test passed
    //   await testSignPayloadAndVerify()
    // test passed
    //  await testAddress()
    // test paseed
    // await testBalance()
    // test passed
    //  await testKoiBalance()
    // test passed
    //  await testStake()
    // test passed
    // await testWithdraw ()
    // test passed
    // await testVote ()
    // test passed
    // await testTransfer ()
    // test passed
    // await testRegisterdata();
    // test passed
    // await testDistributeDailyRewards ()
    // test passed
   //  await testBatchAction ()
    // test passed
    //await testGetContractState ()
    // test passed
    //await testContentView();
    // test passed
    // await testUpdatetrafficlogs ()
    //await testBlockheight();
    //  not yet
    //await testDistributeDailyRewards();
    // test passed
    // await testRankProposal()
    // test passed
    // await testMyContent();
    // test passed
    // await testRetrieveTopContent();
    // test passed
    // await testReadSate();
    // await testNftTransactionData()
    //testing
   // await testGetTopContent();

  // await testGetTrafficLogFromGateWay()

   await testSubmitTrafficLog();

  } catch (err) {
    throw Error(err);
  }
}


async function testSubmitTrafficLog () {
  // test 11 - input a batch action to arweave 
 //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
 let arg = {
  gateWayUrl: 'https://arweave.dev/logs/',
  stakeAmount: 2
 };
 
  var result =  await ktools.submitTrafficLog(arg);
  
  console.log('transaction', result)

  if ( typeof(result) === "undefined" || result === null ) {
      throw Error ('Failed while attempting to vote')
  }

}

/*

async function testMyContent() {
  const txId = await ktools.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned ", txId);
  }
}


async function testSubmitTrafficLog () {
  // test 11 - input a batch action to arweave 
 //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
 let arg = {
  gateWayUrl: 'https://arweave.dev/logs/',
  stakeAmount: 2
 };
 
  var result =  await ktools.submitTrafficLog(arg);
  
  console.log('transaction', result)

  if ( typeof(result) === "undefined" || result === null ) {
      throw Error ('Failed while attempting to vote')
  }

}

async function testBatchAction () {
  // test 11 - input a batch action to arweave 
 let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
  var result =  await ktools.batchAction(txid);
  
  console.log('transaction', result)

  if ( typeof(result) === "undefined" || result === null ) {
      throw Error ('Failed while attempting to vote')
  }

}



async function testPostData(){
   
  const logs = await ktools._getTrafficLogFromGateWay('https://arweave.dev/logs');
  //const line = logs.data.split('\r\n');
  console.log(logs.data.summary);
        let dataHash = await ktools._hashData(logs.data.summary);
        console.log('&&&&&&&&&', dataHash);

 let tx = await  ktools.postData(logs.data.summary);


 console.log(tx);

 let bundledTrafficLogs = await arweave.transactions.getData(
  '_ZVR3nxmW_1G7fFtEYzc6sZ5WRDXS2uXpUZu1bGLyFg',
  { decode: true, string: true }
);
//console.log('*******',bundledTrafficLogs );
const line = JSON.parse(bundledTrafficLogs);
line.push(1);

let proHash = await ktools._hashData(line);
console.log('&&&&&&&&&', proHash);
let isValid = dataHash === proHash;
console.log(isValid);

console.log(line[41]);

let NFTid = line[41].url.substring(1);

console.log(NFTid);

 if ( typeof(tx) === "undefined" || tx === null ) {
     throw Error ('Failed while attempting to verify')
 }

 console.log('here it is valid or not', tx);
}


/*
async function testValidateData(){
  // test traffic log validation 
  
  let result = await ktools.validateData("trafficlog");

  return result;

}

async function  testGetTrafficLogFromGateWay(){
   
  const logs = await ktools._getTrafficLogFromGateWay('https://arweave.dev/logs');
  //const line = logs.data.split('\r\n');
  console.log(logs.data.summary);
  //console.log(typeof line);
  if (typeof logs === "undefined" ||logs === null) {
    throw Error("Failed while attempting to verify");
  }
  

}

async function testGetTopContent() {
  const contents = await ktools.getTopContent();
  console.log(contents.data);
  if (typeof contents === "undefined" || contents === null) {
    throw Error("Failed while attempting to verify");
  }
}

async function testContentView() {
  let contentTxId = "OsrHVoEQot03wQfSzxHmMhZMwtYbanUZx5cjtdJcfk0";
  const result = await ktools.contentView(contentTxId);
  console.log(result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to verify");
  }
}

async function testNftTransactionData() {
  const txData = await ktools.nftTransactionData(
    "qZa1iNiUus-kRbBqwx0UimPNGVtCSZvQAQ9aCvPfHmI"
  );
  console.log(txData);
  if (typeof txData === "undefined" || txData === null) {
    throw Error("The address function returned ");
  }
}



async function testMint() {
  let address = "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo";
  var submission = {
    targetAddress: address,
    qty: 50,
  };
  const result = await ktools.mint(submission);
  const wallet = await ktools.getWalletAddress();
  console.log("Array", wallet);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned ", result);
  }
}

async function testRetrieveTopContent() {
  const result = await ktools.retrieveTopContent();
  console.log("Array", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned ", result);
  }
}

async function testRegisterdata () {
    // test 8 - write to arweave
    let txId = 'PJS-kIJYdSkML2kmxJl6PSp9gqU8_xZJWHZawxQOTsw';

    var result =  await ktools.registerData(txId);
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}
/*
async function testRegisterdata() {
  // test 8 - write to arweave
  let txId = "OsrHVoEQot03wQfSzxHmMhZMwtYbanUZx5cjtdJcfk0";
  let owner = "cf3iB51tJrVSQ-j-TmcRuMYeuvho6y-7IrQm9O7QKIk";

  var result = await ktools.registerData(txId, owner);

  console.log("transaction", result);

  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testReadSate() {
  const txId = "EKW3AApL4mdLc6sIhVr3Cn8VN7N9VAQUp2BNALHXFtQ";
  const state = await ktools.readContract(txId);
  console.log(state);
}
async function testRetrieveTopContent() {
  const result = await ktools.retrieveTopContent();
  console.log("Array", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned ", result);
  }
}



async function testAddress () {
    // test 1 - address
    var address = await ktools.getWalletAddress()
    console.log(address);

    if ( typeof(address) === "undefined" || address === null ) {
        throw Error ('The address function returned ', address)
    }
}

async function testBalance () {
    // test 2 - balance
    var balance =  await ktools.getWalletBalance()
    console.log('balance is ', balance)

    if ( typeof(balance) === "undefined" || balance === null ) {
        throw Error ('The balance function returned ', balance)
    }
    

}

async function testWrite () {
    // test 3 - write to arweave
    var data = {
        "foo" : "bar"
    }
    var transaction =  await ktools.postData(data)

    console.log('transaction........', transaction)

    if ( typeof(transaction) === "undefined" || transaction === null ) {
        throw Error ('Failed while attempting to upload payload')
    }
}
async function testKoiBalance(){

    var koiBalance =  await ktools.getKoiBalance()
    console.log('balance is ', koiBalance)

    if ( typeof(koiBalance) === "undefined" || koiBalance === null ) {
        throw Error ('The balance function returned ', koiBalance)
    }    

}



async function testStake () {
    // test 4 - test create stake
    var qty = 23;

    var result =  await ktools.stake(qty);

    console.log('transaction.............', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to stake')
    }

}


async function testWithdraw () {
    // test 5 - withdraw tokens from staking
    var qty = 777;
    var result =  await ktools.withDraw(qty);

    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to stake')
        
    }

}

async function testVote () {
    // test 6 - write to arweave
    let input = {
      direct: "true",
      voteId: 1,
      userVote: "true"
    }

    var result =  await ktools.vote(input);

    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}


async function testTransfer () {
    // test 7 - write to arweave
    let target = 'WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc';
    
    var result =  await ktools.transfer(1,target);
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}




async function testUpdatetrafficlogs () {
    // test 9 - write to arweave
    // let input = {
    //     "batchTxId": '48slXf-CbgYdsi5-IWiTH8OTxuogEXeD4t0GZ0jJ1ZM',
    //     "stakeAmount": 50
    // };
 arg = {
    // gateWayUrl: "openKoi.com",
    stakeAmount: 50,
}
    
    var result =  await ktools.submitTrafficLog(arg);
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}


async function testDistributeDailyRewards () {
    // test 10 - distribute rewards (if traffic logs have already been submitted)
    var result =  await ktools.distributeDailyRewards();
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}


async function testBatchAction () {
    // test 11 - input a batch action to arweave 
   let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
    var result =  await ktools.batchAction(txId);
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}




async function testGetContractState () {
    // test 12 - get the state of the arweave contract
    var result =  await ktools.getContractState();
    
    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to vote')
    }

}


async function testSignPayloadAndVerify() {
    // test 13 - test payload signatures
    console.log('signing......................................');
    let payload = {
        vote : {
            "function": "vote",
            "voteId" : 1,
            "userVote" : "true"
        }, 
        senderAddress :  await ktools.getWalletAddress()
    }

    payload = await ktools.signPayload(payload);
    console.log(payload);

    if ( typeof(payload.signature) === "undefined" || payload.signature === null ) {
        throw Error ('Failed while attempting to sign')
    }
    
    let input = {
        "function": 'proposeSlash',
        "reciept":payload
    }
    
  //  await ktools._interactWrite(input);
   /// payload.signature += "abel"; // if payload is valid base 64, appended === should not affect outcome

    let isValid = await ktools.verifySignature(payload);

   if ( typeof(isValid) === "undefined" || isValid === null ) {
        throw Error ('Failed while attempting to verify')
    }

   console.log('here it is valid or not', isValid);

}



async function testPostData(){
   
    let data = 'some thing';

   let tx = await  ktools.postData(data);

   if ( typeof(tx) === "undefined" || tx === null ) {
       throw Error ('Failed while attempting to verify')
   }

   console.log('here it is valid or not', tx);
}

async function testValidateData(){
    // test traffic log validation 
    
    let result = await ktools.validateData("trafficlog");

    return result;

}


async function testBlockheight(){
    const blockHeight = await ktools.getBlockheight();
    console.log(blockHeight);
}
async function testRankProposal(){
    const tx = await  ktools. rankProposal();
    console.log('txxxxx')
    console.log(tx);
    if ( typeof(result) === "undefined" || result === null ) {
       throw Error ('Failed while attempting to verify')
   }
}
*/
