# Koi JavaScript SDK
The Koi.js library enables node.js and typescript applications to easily interact with the open Koi network. 

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

Once this has been completed, your wallet will now receive some of the daily KOI tokens every time your content is viewed.

If you do not have a KOI balance, you cannot participate. Your KOI will be burned to register the content.

## KOI Tasks
In order to make sure everyone has open access to the network, we've made it possible for nodes to also run 'tasks' for eachother to earn tokens. 

### Earning KOI
The default task is called StoreCat, and gathers web data onto the permaweb archive. To run StoreCat, you can use a similar implementation to the one above.

```
var koiTools = require('koiTools');
var koi = new koiTools('/path/to/wallet.json')
var result = await koi.runTaskByRegisteredName('getstorecat')
console.log('task:', result)
```

Note: Some tasks take awhile to execute, so the best way to run them is usually with the desktop node client. 

### Requesting Tasks
It is also possible to tap into the Koi network to request work. Once you have KOI tokens, you can set a bounty for a new task.

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



