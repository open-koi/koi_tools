// tests koi-tools.js 
const { koi_tools } = require('../index.js')
var ktools          = new koi_tools ()

// var walletKeyLocation = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";
var walletKeyLocation = "/media/al/files/koi/Arweave/sec2.json"

start()

async function start () {

    console.log("running async block", ktools)

    await ktools.loadWallet(walletKeyLocation)

    try {

        await testSignPayloadAndVerify()

        await testValidateData();

        await testAddress()

        await testBalance()

        await testWrite()

        await testVote ()

        await testTransfer ()

        await testRegisterdata ()

        await testUpdatetrafficlogs ()

        await testWithdraw ()

        await testDistributeDailyRewards ()

        await testBatchAction ()

        await testStake()

        await testGetContractState ()

    } catch ( err ) {
        throw Error (err)
    }

}


async function testAddress () {
    // test 1 - address
    var address = await ktools.getWalletAddress()

    if ( typeof(address) === "undefined" || address === null ) {
        throw Error ('The address function returned ', address)
    }
}

async function testBalance () {
    // test 2 - balance
    var balance =  await ktools.getWalletBalance()
    console.log('balance is ', balance)
    

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


async function testSignPayloadAndVerify() {
    // test 13 - test payload signatures

    let payload = {
        vote : {
            "function": "vote",
            "voteId" : 1,
            "userVote" : "true"
        }, 
        senderAddress :  await ktools.getWalletAddress()
    }

    payload = ktools.signPayload(payload);
    console.log(payload);

    if ( typeof(payload.signature) === "undefined" || payload.signature === null ) {
        throw Error ('Failed while attempting to sign')
    }
    
    payload.signature += "==="; // if payload is valid base 64, appended === should not affect outcome

    let isValid = ktools.verifySignature(payload);

    if ( typeof(isValid) === "undefined" || isValid === null ) {
        throw Error ('Failed while attempting to verify')
    }

    console.log('here it is valid or not', isValid);

}

async function testValidateData(){
    // test traffic log validation 
    
    let result = await ktools.validateData("trafficlog");

    return result;

}