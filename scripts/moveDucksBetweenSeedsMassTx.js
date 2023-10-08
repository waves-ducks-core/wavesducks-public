const axios = require("axios");
const cfAddress = "";
const senderPublicKey = "";
const masterSeed = "";
const recipient = "3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF";
//Send over NFT
(async () => {
  axios({
    method: "get",
    url:
      "https://cluster.node.turtlenetwork.eu/assets/nft/" +
      cfAddress +
      "/limit/1000",
  }).then(({ data }) => {
    for (let i = 0; i < data.length; i++) {
      console.log(data[i]);
      const massTx = massTransfer(
        {
          additionalFee: 400000,
          senderPublicKey: senderPublicKey,
          assetId: data[i]["assetId"],
          transfers: [{ recipient: recipient, amount: 1 }],
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      broadcast(SignedTx).catch((e) => console.log(e));
    }
  });
})();
