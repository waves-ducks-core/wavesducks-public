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
      const massTx = transfer(
        {
          additionalFee: 400000,
          senderPublicKey: senderPublicKey,
          assetId: data[i]["assetId"],
          recipient: recipient,
          amount: 1,
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      broadcast(SignedTx).catch((e) => console.log(e));
    }
  });
})();

const massTx = transfer(
  {
    additionalFee: 400000,
    senderPublicKey: senderPublicKey,
    assetId: "C1iWsKGqLwjHUndiQ7iXpdmPum9PeCDFfyXBdJJosDRS",
    recipient: recipient,
    amount: 9571179354,
  },
  null
);
let SignedTx = signTx(massTx, masterSeed);
console.log(SignedTx);
broadcast(SignedTx).catch((e) => console.log(e));

const massTx2 = transfer(
  {
    additionalFee: 400000,
    senderPublicKey: senderPublicKey,
    assetId: null,
    recipient: recipient,
    amount: 550534215,
  },
  null
);
let SignedTx2 = signTx(massTx2, masterSeed);
console.log(SignedTx2);
broadcast(SignedTx2).catch((e) => console.log(e));
