// tests koi-tools.js
require("dotenv").config();
const { koi_tools } = require("../src/index.js");
var ktools = new koi_tools();

var walletKeyLocation = process.env.WALLET_LOCATION;

start();

async function start() {
  console.log("running async block", ktools);

  await ktools.loadWallet(walletKeyLocation);

  try {
    // test passed
    //    await testPostData();
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
    // await testRegisterdata ()
    // test passed
    // await testDistributeDailyRewards ()
    // test passed
    // await testBatchAction ()
    // test passed
    // await testGetContractState ()
    // test passed
    await testContentView();
    // test passed
    // await testUpdatetrafficlogs ()
    //await testBlockheight();
    //  not yet
    //await testDistributeDailyRewards();
    // test passed
    // await testRankProposal()
    // test passed
    // testMycontent();
    // test passed
    // testRetrieveTopContent()
  } catch (err) {
    throw Error(err);
  }
}
async function testContentView() {
  let contentTxId = "WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc";
  const result = await ktools.contentView(contentTxId);
  console.log(result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to verify");
  }
}
/*
async function testMyContent() {
  const address = "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo";

  const txId = await ktools.myContent(address);
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned ", address);
  }
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

async function testRegisterdata () {
    // test 8 - write to arweave
    let txId = 'WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc';

    var result =  await ktools.registerData(txId);
    
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
    var result =  await ktools.batchAction();
    
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
