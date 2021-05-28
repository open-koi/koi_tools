"use strict";

// We don't test web with Jest because it requires browser specific functionality

let kcommon = require("../dist/common");

const ktools = new kcommon.Common();

test("Generate wallet", async () => {
  expect(await ktools.generateWallet()).toBe(true);
  expect(ktools.wallet.kty).toBe("RSA");
});

test("Get wallet balance", async () => {
  expect(await ktools.getWalletBalance()).toBe("0");
});

test("Get block height", async () => {
  expect(await ktools.getBlockHeight()).toBeGreaterThan(0);
});

test("Mint", async () => {
  const submission = {
    targetAddress: "D3lK6_xXvBUXMUyA2RJz3soqmLlztkv-gVpEP5AlVUo",
    qty: 5
  };
  const txId = await ktools.mint(submission);
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

test("Get wallet transactions", async () => {
  const transactions = await ktools.getWalletTxs(ktools.address);
  expect(transactions).toBeTruthy();
});

test("Get NFT reward null", async () => {
  jest.setTimeout(15000)
  const reward = await ktools.getNftReward("asdf");
  expect(reward).toBe(null);
});

test("Get NFT reward", async () => {
  jest.setTimeout(15000)
  const reward = await ktools.getNftReward("1UDe0Wqh51-O03efPzoc_HhsUPrmgBR2ziUfaI7CpZk");
  expect(reward).toBeGreaterThan(1600);
});