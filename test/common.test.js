let kcommon = require("../dist/common");

const ktools = new kcommon.Common();

test("Generate wallet", () => {
  return ktools.generateWallet().then((res) => {
    expect(res).toBe(true);
    expect(ktools.wallet.kty).toBe("RSA");
  })
});
