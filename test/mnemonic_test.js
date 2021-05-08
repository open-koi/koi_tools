const koi_tools = require("../lib/tools.js");
const ktools = new koi_tools();
const ktools_load = new koi_tools();

test().then((res) => {
    console.log("Test result:", res);
})

async function test() {
    // Test wallet generation
    console.log("\nGenerating wallet using mnemonic, this can take a minute")
    if (await ktools.generateWallet(true))
        console.log(`Wallet generated\nmnemonic: ${ktools.mnemonic}\naddress: ${ktools.address}\n`);
    else return "Failed to generate wallet";

    // Save mnemonic
    let mnemonic = ktools.mnemonic;

    // Create new ktools instance
    console.log(`New wallet should be empty\nmnemonic: ${ktools_load.mnemonic}\naddress: ${ktools_load.address}\n`);

    // Load wallet
    console.log("Loading wallet using mnemonic, this can a take minute")
    if (await ktools_load.loadWallet(mnemonic))
        console.log(`Wallet loaded using mnemonic\nmnemonic: ${ktools_load.mnemonic}\naddress: ${ktools_load.address}\n`);
    else return "Failed to load wallet";
    
    return "Success";
}