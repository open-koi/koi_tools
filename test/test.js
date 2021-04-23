const { koi_tools } = require("../index.js");
var ktools = new koi_tools(true);
require("dotenv").config();

var walletKeyLocation = process.env.WALLET_LOCATION;
//const redisClient = require("../helpers/redis");

start();
const Arweave = require("arweave/node");
const smartweave = require("smartweave");

const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});
async function start() {
  //console.log("running async block", ktools);

  await ktools.loadWallet(walletKeyLocation);

  // try {
  //await testMint();
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
  //await testStake(1);
  // test passed
  // await testWithdraw ()
  // test passed
  // await testVote();
  //await testVote();
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
  //await testMyContent();
  // test passed
  //await testRetrieveTopContent();
  // test passed
  // await testReadSate();
  // await testNftTransactionData()
  //test passed
  // await testGetTopContent();
  // test passed
  // await testGetTrafficLogFromGateWay()
  // test passed
  //await testSubmitTrafficLog();
  // test
  //await testUserState();
  //await testStake();
  await testGetKoiBalnace();
  // } catch (err) {
  //   throw Error(err);
  // }
}

async function testGetKoiBalnace() {
  const result = await ktools.getKoiBalance();
  console.log("result", result);
}
/*
async function testSubmitTrafficLog() {
  // test 11 - input a batch action to arweave
  //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
  let arg = {
    gateWayUrl: "https://arweave.dev/logs/",
    stakeAmount: 2,
  };

  var result = await ktools.submitTrafficLog(arg);

  console.log("transaction", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testMint() {
  let address = "zFGpdtH0tpXAvG7PDMhq-ExCR_w7c4PYuwmoRZKmMpA";
  var submission = {
    targetAddress: address,
    qty: 10000000,
  };
  const result = await ktools.mint(submission);
  const wallet = await ktools.getWalletAddress();
  console.log("result", result);
  console.log("Array", wallet);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned ", result);
  }
}
async function testStake() {
  // test 4 - test create stake
  var qty = 1;

  var result = await ktools.stake(qty);

  console.log("transaction.............", result);

  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to stake");
  }
}


async function testRetrieveTopContent() {
  const result = await ktools.retrieveTopContent();
  console.log("Array", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned ", result);
  }
}
async function testStake(qty) {
  console.log("RUNNING STAKE")
  console.log(redisClient.get("pendingStateArray",(err,val)=>{
    console.log(val)
  }))
  let result = await ktools.stake(qty)
  console.log({result})
  arweave.transactions.getStatus(result).then(status => {
    console.log("STATUS",status);
    // 200
  })
  return result;
}


async function testMyContent() {
  const txId = await ktools.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned ", txId);
  }
}





/*
async function testVote() {
  const arg = {
    voteId: -2,
    direct: false,
  };
  const result = await ktools.vote(arg);
  console.log("result", result.message);
}



async function testUserState() {
  const userState = await ktools.userState();
  console.log(userState);
  if (typeof userState === "undefined" || userState === null) {
    throw Error("userState undefine");
  }
}


async function testSubmitTrafficLog() {
  // test 11 - input a batch action to arweave
  //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
  let arg = {
    gateWayUrl: "https://arweave.dev/logs/",
    stakeAmount: 2,
  };

  var result = await ktools.submitTrafficLog(arg);

  console.log("transaction", result);

  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}


async function testMyContent() {
  const txId = await ktools.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned ", txId);
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

*/
