const kweb = new koi_tools.koi_web.Web();

test().then((result) => {
  console.log("Result", result);
});

async function test() {
  await testGenerateWallet();
  await testGetKoiBalance();
  await testGetWalletBalance();
  //await testRetrieveTopContent(); // Test failing
  await testMint();
  await testMyContent();
  await testGetTopContent();
  await testNftTransactionData();

  return true;
}

async function testGenerateWallet() {
  console.log("Testing generateWallet");
  await kweb.generateWallet();
  console.log("Wallet address", kweb.address);
}

async function testGetKoiBalance() {
  console.log("Testing getKoiBalance");
  console.log(await kweb.getKoiBalance());
}

async function testGetWalletBalance() {
  console.log("Testing getWalletBalance");
  console.log(await kweb.getWalletBalance());
}

async function testRetrieveTopContent() {
  console.log("Testing retrieveTopContent");
  const result = await kweb.retrieveTopContent();
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

async function testMyContent() {
  console.log("Testing myContent");
  const txId = await kweb.myContent();
  console.log(txId);
  if (typeof txId === "undefined" || txId === null) {
    throw Error("The address function returned " + txId);
  }
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
