const kweb = new koi_tools.koi_web.Web();

test().then((result) => {
  console.log("Result", result);
});

async function test() {
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
  console.log("Testing retrieveTopContent");
  const result = await kweb.retrieveTopContent();
  console.log("Array", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("The address function returned " + result);
  }
}

async function testGetKoiBalance() {
  console.log("Testing getKoiBalance");
  const result = await kweb.getKoiBalance();
  console.log("result", result);
}

async function testMint() {
  console.log("Testing mint");
  const address = "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo";
  const submission = {
    targetAddress: address,
    qty: 50
  };
  const result = await kweb.mint(submission);
  const wallet = await kweb.getWalletAddress();
  console.log("Array", wallet);
}

async function testSubmitTrafficLog() {
  console.log("Testing submitTrafficLog");
  // test 11 - input a batch action to arweave
  //let txid =  'KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8'
  const arg = {
    gateWayUrl: "https://arweave.dev/logs/",
    stakeAmount: 2
  };
  const result = await kweb.submitTrafficLog(arg);
  console.log("transaction", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testMyContent() {
  console.log("Testing myContent");
  const txId = await kweb.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned " + txId);
  }
}

async function testBatchAction() {
  console.log("Testing batchAction");
  // test 11 - input a batch action to arweave
  const txid = "KznQBSG-PRPwygFt0E_LfB3hdlqsdmz_O5Q62Nx2rK8";
  const result = await kweb.batchAction(txid);

  console.log("transaction", result);
  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}

async function testValidateData() {
  console.log("Testing validateData");
  // test traffic log validation
  const result = await kweb.validateData("trafficlog");
  return result;
}

async function testGetTopContent() {
  console.log("Testing getTopContent");
  const contents = await kweb.getTopContent();
  console.log(contents.data);
  if (typeof contents === "undefined" || contents === null) {
    throw Error("Failed while attempting to verify");
  }
}

async function testNftTransactionData() {
  console.log("Testing nftTransactionData");
  const txData = await kweb.nftTransactionData(
    "qZa1iNiUus-kRbBqwx0UimPNGVtCSZvQAQ9aCvPfHmI"
  );
  console.log(txData);
  if (typeof txData === "undefined" || txData === null) {
    throw Error("The address function returned ");
  }
}

// Can't test, state needed for content view
// async function testContentView() {
//   const contentTxId = "OsrHVoEQot03wQfSzxHmMhZMwtYbanUZx5cjtdJcfk0";
//   const result = await kweb.contentView(contentTxId);
//   console.log(result);
//   if (typeof result === "undefined" || result === null) {
//     throw Error("Failed while attempting to verify");
//   }
// }
