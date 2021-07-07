"use strict";

// We don't test web with Jest because it requires browser specific functionality

let kcommon = require("../dist/common");

const ktools = new kcommon.Common();

test("Generate wallet", async () => {
  expect(await ktools.generateWallet()).toBe(true);
  expect(ktools.wallet.kty).toBe("RSA");
});

test("Get wallet balance", async () => {
  expect(await ktools.getWalletBalance()).toBeLessThan(1);
});

test("Get block height", async () => {
  jest.setTimeout(15000);
  expect(await ktools.getBlockHeight()).toBeGreaterThan(0);
});

test("Mint", async () => {
  jest.setTimeout(60000);
  const submission = {
    targetAddress: "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo",
    qty: 5
  };
  const txId = await ktools.mint(submission);
  console.log(txId);
  expect(typeof txId).toBe("string");
  expect(txId.trim()).not.toHaveLength(0);
});

test("Sign payload", async () => {
  let payload = {
    vote: "FooBar",
    senderAddress: "",
  }
  const signedPayload = await ktools.signPayload(payload);

  const signature = signedPayload.signature;
  expect(typeof signature).toBe("string");
  expect(signature.trim()).not.toHaveLength(0);

  const owner = signedPayload.owner;
  expect(typeof owner).toBe("string");
  expect(owner.trim()).not.toHaveLength(0);
});

test("Verify signature", async () => {
  let payload = {
    vote: "FooBar",
    senderAddress: "",
  }
  const signedPayload = await ktools.signPayload(payload);

  expect(await ktools.verifySignature(signedPayload)).toBe(true);
});

test("Arweave GQL", async () => {
  jest.setTimeout(15000);
  const query = "query { transactions(block: {min: 0, max: 10}) { edges { node { id } } } }";
  const request = JSON.stringify({query});
  const res = await ktools.gql(request);
  expect(res).toBeTruthy();
});

test("Get owned transactions", async () => {
  jest.setTimeout(15000);
  const transactions = await ktools.getOwnedTxs("ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4", 2);
  expect(transactions.data.transactions.edges.length).toBe(2);
});

test("Get recipient transactions", async () => {
  jest.setTimeout(15000);
  const transactions = await ktools.getRecipientTxs("ou-OUmrWuT0hnSiUMoyhGEbd3s5b_ce8QK0vhNwmno4", 3);
  expect(transactions.data.transactions.edges.length).toBe(3);
});

test("Get NFT reward null", async () => {
  jest.setTimeout(60000);
  const reward = await ktools.getNftReward("asdf");
  expect(reward).toBe(null);
});

test("Get NFT reward", async () => {
  jest.setTimeout(60000);
  const reward = await ktools.getNftReward("1UDe0Wqh51-O03efPzoc_HhsUPrmgBR2ziUfaI7CpZk");
  expect(reward).toBeGreaterThan(1600);
});

test("sign transaction", async () => {
  const transaction = await kcommon.arweave.createTransaction(
    {
      data: Buffer.from('Some data', 'utf8')
    }
  );
  const signedTransaction = await ktools.signTransaction(transaction);
  expect(typeof signedTransaction.signature).toBe("string");
  expect(signedTransaction.signature.trim()).not.toHaveLength(0);
});

test("get owner nfts", async () => {
  const owner = "IsAUH6ruDQgbhr7SvfYUFzQJO-6MGXaRFfJ0FIyHvOQ";
  const nfts = await ktools.getNftsByOwner(owner);
  expect(nfts.length).toBeGreaterThan(4);
});

// test("generate mnemonic", async () => {
//   jest.setTimeout(600000);
//   expect(await ktools.generateWallet(true)).toBeTruthy();
// });