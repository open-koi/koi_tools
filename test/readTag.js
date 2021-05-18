const Arweave = require("arweave/node");
const arweave = Arweave.init({
  host: "arweave.net",
  protocol: "https",
  port: 443,
});

arweave.transactions
  .get("3Ac6bGEwJvx3LBOwTBrkqK-UmahBWuA6cVINNXodXkE")
  .then((transaction) => {
    let tagsObj = {};
    transaction.get("tags").forEach((tag) => {
      let key = tag.get("name", { decode: true, string: true });
      let value = tag.get("value", { decode: true, string: true });

      tagsObj[key] = value;
    });

    console.log(tagsObj);
  });
