# Koi JavaScript SDK
The Koi.js library enables node.js and typescript applications to easily interact with the open Koi network.

## Steps to Interact with the SDK in your Project
1. Add the Koi-tools module to your node script and then initialize the koi class.
    ```
    const tools = require('./koi-tools')
    var ktools = new tools()
    ```

2. Optional - Add the Arweave module to your project if your app plans to directly transact with the permaweb outside of using the Koi-tools library
   ```
   const Arweave = require('arweave/node')
   const arweave = Arweave.init({
     host: 'arweave.net',
     protocol: 'https',
     port: 443
   });
   ```

3. Define the absolute path to your AR wallet's key.
   - Note that the wallet address should not be held inside of your project when you check the project into GitHub
   ```
   var walletKeyLocation = "path/to/wallet.json";
   ```

5. Define a function to bootstrap your app and utilize the koi-tools library `loadWallet` method to be returned the address of your wallet from the permaweb.
    ```
    async function start() {

      console.log("running async block", ktools)

      await ktools.loadWallet(walletKeyLocation)

      try {
        // define async functions here that interact with the koi library upon app startup such as verifying signed payloads

      } catch (err) {
        throw Error(err)
      }

    }

    start()
    ```

5. Check out the test.js file held in this library with examples of how to interact with koi-tools.

## Content Rewards
The Koi consensus process releases 1,000 KOI tokens per day to reward the best content that has ever been registered, proportional to the attention it receives in that time period.

Register arweave content like so:

```
var koiTools = require('koiTools');
var koi = new koiTools('/path/to/wallet.json')
var burnAmount = 5; // the amount of koi to burn on registration (burn more to earn more!)
var result = await koi.registerContent(< arweaveTxId >, burnAmount ? optional)
console.log('registered:', result)
```

Once this has been completed, your wallet will receive a portion of the daily KOI tokens every time your content is viewed.

If you do not have a KOI balance, you cannot participate. Your KOI will be burned to register the content.

## KOI Tasks
In order to ensure everyone has open access to the network, we've made it possible for nodes to run 'tasks' for each other to earn tokens.

### Earning KOI
The default task is called StoreCat, which gathers web data and stores it on the permaweb archive. To run StoreCat, you can use a similar implementation to the one above.

```
var koiTools = require('koiTools');
var koi = new koiTools('/path/to/wallet.json')
var result = await koi.runTaskByRegisteredName('getstorecat')
console.log('task:', result)
```

Note: Some tasks take a while to execute, so the best way to run them is with the desktop node client.

### Requesting Tasks
It is possible to tap into the Koi network to request work. Once you have KOI tokens, you can set a bounty for a new task.

```
var koiTools = require('koiTools');
var koi = new koiTools('/path/to/wallet.json')
var koiTask = {
   id : "getstorecat", // unique global ID *see runTaskByRegisteredName above
   bounty : "5",       // bounty per result in KOI
   description : "
      Help StoreCat gather web data by running this simple web scraping task. The StoreCat does not have access to your computer, but will use your internet connection to browse the web.
   ", // long form description text
   expiry : new Date () + 5,       // expiry date after which unspent bounty tokens will be returned
   taskFile : " arweave TX ID of task file" // the execution environment currently supports most NPM bundles
}
var result = await koi.registerTask(koiTask)
console.log('registered:', result)
```



