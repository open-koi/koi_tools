let knode = require("../dist/node");

const ktools = new knode.Node();

test("Generate wallet", () => {
  return ktools.generateWallet().then((res) => {
    expect(res).toBe(true);
    expect(ktools.wallet.kty).toBe("RSA");
  })
});
  