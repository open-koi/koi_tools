// tests koi-tools.js 
const { koi_tools } = require('../index.js')
var ktools          = new koi_tools ()

var walletKeyLocation = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json"

start()

async function start () {

    console.log("running async block", ktools)

    await ktools.loadWallet(walletKeyLocation)

    try {

        await testSignPayloadAndVerify()

        await testAddress()

       await testBalance()
       
       await testKoiBalance()

         await testStake()

       // await testVote ()

       // await testTransfer ()

       // await testRegisterdata ()

      //  await testUpdatetrafficlogs ()

       // await testWithdraw ()

       // await testDistributeDailyRewards ()

       // await testBatchAction ()

      

       // await testGetContractState ()
    

    } catch ( err ) {
        throw Error (err)
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
/*

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
    let input = {
        "batchTxId": '48slXf-CbgYdsi5-IWiTH8OTxuogEXeD4t0GZ0jJ1ZM',
        "stakeAmount": 50
    };
    
    var result =  await ktools.registerData(input);
    
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
*/

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
    /*
    let input = {
        "function": 'proposeSlash',
        "reciept":payload
    }
    */
  //  await ktools._interactWrite(input);
   /// payload.signature += "abel"; // if payload is valid base 64, appended === should not affect outcome

    let isValid = await ktools.verifySignature(payload);

   if ( typeof(isValid) === "undefined" || isValid === null ) {
        throw Error ('Failed while attempting to verify')
    }

   console.log('here it is valid or not', isValid);

}

