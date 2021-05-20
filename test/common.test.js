// We don't test web with Jest because it requires browser specific functionality

let kcommon = require("../dist/common");

const ktools = new kcommon.Common();

test("Generate wallet", async () => {
  expect(await ktools.generateWallet()).toBe(true);
  expect(ktools.wallet.kty).toBe("RSA");
});
  
