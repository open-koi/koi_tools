const koi_tools = require("../dist/koi_tools.js");

/*
const walletKeyLocation = process.env.WALLET_LOCATION;
const ktools = new koi_tools.Koi();

test().then((result) => {
  console.log("Result", result);
});

async function test() {
  await ktools.loadWallet(walletKeyLocation);

  await testRetrieveTopContent();
  await testGetKoiBalance();
  await testMint();
  await testSubmitTrafficLog();
  await testMyContent();
  await testBatchAction();
  await testValidateData();
  await testGetTopContent();
  await testNftTransactionData();

  return true;
}

async function testRetrieveTopContent() {
  const result = await ktools.retrieveTopContent();
  console.log("Array", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned " + result);
  }
}

async function testGetKoiBalance() {
  const result = await ktools.getKoiBalance();
  console.log("result", result);
}

async function testMint() {
  const address = "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo";
  const submission = {
    targetAddress: address,
    qty: 50
  };
  const result = await ktools.mint(submission);
  const wallet = await ktools.getWalletAddress();
  console.log("Array", wallet);
}

async function testSubmitTrafficLog() {
  // test 11 - input a batch action to arweave
  //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
  const arg = {
    gateWayUrl: "https://arweave.dev/logs/",
    stakeAmount: 2
  };
  const result = await ktools.submitTrafficLog(arg);
  console.log("transaction", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testMyContent() {
  const txId = await ktools.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned " + txId);
  }
}

async function testBatchAction() {
  // test 11 - input a batch action to arweave
  const txid = "KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8";
  const result = await ktools.batchAction(txid);

  console.log("transaction", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testValidateData() {
  // test traffic log validation
  const result = await ktools.validateData("trafficlog");
  return result;
}

async function testGetTopContent() {
  const contents = await ktools.getTopContent();
  console.log(contents.data);
  if (typeof contents === "undefined" || contents === null) {
    throw Error("Failed while attempting to verify");
  }
}

// Can't test, state needed for content view
// async function testContentView() {
//   const contentTxId = "OsrHVoEQot03wQfSzxHmMhZMwtYbanUZx5cjtdJcfk0";
//   const result = await ktools.contentView(contentTxId);
//   console.log(result);
//   if (typeof result === "undefined" || result === null) {
//     throw Error("Failed while attempting to verify");
//   }
// }

async function testNftTransactionData() {
  const txData = await ktools.nftTransactionData(
    "qZa1iNiUus-kRbBqwx0UimPNGVtCSZvQAQ9aCvPfHmI"
  );
  console.log(txData);
  if (typeof txData === "undefined" || txData === null) {
    throw Error("The address function returned ");
  }
}
*/