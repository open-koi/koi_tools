// tests koi-tools.js 
const tools       = require('./koi-tools')
var ktools        = new tools()
const Arweave = require ('arweave/node')
const arweave = Arweave.init({
    host: 'arweave.net',
    protocol: 'https',
    port: 443
  });

var walletKeyLocation = "/Users/abelsebhatu/Desktop/koi-protocol/dist/keywallet.json";

start()

async function start () {

    console.log("running async block", ktools)

    await ktools.loadWallet(walletKeyLocation)

    try {
        await testAddress()
    
        await testBalance()
    
       // await testWrite()

        //  await testStake()

        await testVote ()

       // await testTransfer ()

       // await testRegisterdata ()

       // await testUpdatetrafficlogs ()

       // await testWithdraw ()


       // await testDistributeDailyRewards()

       // await testBatchAction ()

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
    if ( balance = 0 ) {
        throw Error ('The balance function failed to retrieve the dummy wallet.')
    }

}

async function testWrite () {
    // test 3 - write to arweave
    var data = {
        "foo" : "bar"
    }
    var transaction =  await ktools.postData(data)

    console.log('transaction........', transaction)

    if ( typeof(address) === "undefined" || address === null ) {
        throw Error ('Failed while attempting to upload payload')
    }

}


async function testStake () {
    // test 3 - write to arweave
    var qty = 2;

    var result =  await ktools.stake(qty);
    
     let data = await arweave.transactions.getData(result, { decode: true, string: true });

    console.log('transaction.............', data)

    if ( typeof(data) === "undefined" || data === null ) {
        throw Error ('Failed while attempting to stake')
    }

}


async function testWithdraw () {
    // test 3 - write to arweave
    var qty = 777;
    var result =  await ktools.withDraw(qty);

    console.log('transaction', result)

    if ( typeof(result) === "undefined" || result === null ) {
        throw Error ('Failed while attempting to stake')
    }

}




async function testVote () {
    // test 3 - write to arweave
    //var qty = 777;
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
        // test 3 - write to arweave
        //var qty = 777;
        let target = 'WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc';
        
    
        var result =  await ktools.transfer(1,target);
     
        console.log('transaction', result)
    
        if ( typeof(result) === "undefined" || result === null ) {
            throw Error ('Failed while attempting to vote')
        }

    }

    async function testRegisterdata () {
        // test 3 - write to arweave
        //var qty = 777;
        let txId = 'WL32qc-jsTxCe8m8RRQfS3b3MacsTQySDmJklvtkGFc';
        
    
        var result =  await ktools.registerData(txId);
     
        console.log('transaction', result)
    
        if ( typeof(result) === "undefined" || result === null ) {
            throw Error ('Failed while attempting to vote')
        }

    }


    async function testUpdatetrafficlogs () {
        // test 3 - write to arweave
        //var qty = 777;
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
        
        
        
    
        var result =  await ktools.distributeDailyRewards();
     
        console.log('transaction', result)
    
        if ( typeof(result) === "undefined" || result === null ) {
            throw Error ('Failed while attempting to vote')
        }

    }


    async function testBatchAction () {
        
    
        var result =  await ktools.batchAction();
     
        console.log('transaction', result)
    
        if ( typeof(result) === "undefined" || result === null ) {
            throw Error ('Failed while attempting to vote')
        }

    }


    async function testGetContractState () {
        
    
        var result =  await ktools.getContractState();
     
        console.log('transaction', result)
    
        if ( typeof(result) === "undefined" || result === null ) {
            throw Error ('Failed while attempting to vote')
        }

    }


