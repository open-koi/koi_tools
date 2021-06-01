const { koi_tools } = require("../index.js");
var ktools = new koi_tools();
async function checkTxConfirmation(txid, num, task) {
  num += 1;
  console.log(
    "tx is being added to blockchain ......" + num + "%" + " " + task
  );
  try {
    await ktools.getTransaction(txid);
    var found = true;
    console.log("transaction found");
  } catch (err) {
    console.log(err.type);
  }
  if (found === true) {
    return true;
  }
  await checkTxConfirmation(txid, num, task);
}
checkTxConfirmation("Q9pGbmfYPsxaYsp9OVLvGWRo1EEKz-WZBJP7TqXRdOc", 0, "stake");
