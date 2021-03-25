# KOI_Tasks Progress

The following repo contains demo code to achieve the functionality of `Run javascript bundles locally`. The repo contains a folder `JS_APP_DEPLOY` Which is basically a test app, that would call the bundler API for specific endpoint. The file `loadingRunningArweaveFile.js` expects a arweave uploaded JS file which it would execute in its local context.

## Steps
1. Write Code in the `JS_APP_DEPLOT -> index.js` that you would want to execute at the client node.
2. Run `npm run build` while in the `JS_APP_DEPLOT` directory. This would trigger a webpack build, building the application in a single file under `JS_APP_DEPLOT -> dist -> main.js`.
3. Deploy the file under `JS_APP_DEPLOT -> dist -> main.js` to the arweave `arweave deploy JS_APP_DEPLOT/dist/main.js --key-file path/to/arweave-key.json`.
4. Replace the URL in `loadingRunningArweaveFile.js` with the new JS file address given by Arweave.
5. Run the file `node loadingRunningArweaveFile.js`

