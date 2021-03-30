// tests koi-tools.js

const { koi_tools } = require("../index.js");
var ktools = new koi_tools();
require("dotenv").config();
var walletKeyLocation = process.env.WALLET_LOCATION;

start();

async function start() {
  console.log("running async block", ktools);

  await ktools.loadWallet(walletKeyLocation);

  try {
    await testRegisterdata();
  } catch (err) {
    throw Error(err);
  }
}

async function testRegisterdata() {
  // test 8 - write to arweave
  let txId = "1UDe0Wqh51-O03efPzoc_HhsUPrmgBR2ziUfaI7CpZk";

  var result = await ktools.registerData(txId);

  console.log("transaction", result);

  if (typeof result === "undefined" || result === null) {
    throw Error("Failed while attempting to vote");
  }
}
