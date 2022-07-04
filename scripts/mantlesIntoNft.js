const axios = require("axios");

dapp = "3PCoF5ZnsQJKAJJCoSqUcVVqJ2Dm4fvn9ar";
url =
  "https://node.turtlenetwork.eu/addresses/data/" +
  dapp +
  "?matches=artefactId_.%2A_level";
seed = "";
function getCall() {
  ids = [];
  axios({
    method: "get",
    async: false,
    url: url,
  }).then(({ data: dataO }) => {
    console.log(dataO);
    for (let i = 0; i < dataO.length; i++) {
      const id = dataO[i]["key"].split("_")[1];
      ids.push(id);
      console.log(dataO.length, i);
      if (ids.length == 10 || i == dataO.length - 1) {
        idString = "";
        for (let j = 0; j < ids.length; j++) {
          idString += ids[j] += ";";
        }
        idString = idString.slice(0, -1);
        console.log(idString);
        const mintNft = invokeScript(
          {
            version: 1,
            additionalFee: 400000,
            dApp: dapp,
            call: {
              function: "issueNftForMantles",
              args: [{ type: "string", value: idString }],
            },
            payment: [],
          },
          seed
        );

        broadcast(mintNft).catch((e) => console.log(JSON.stringify(e)));

        const sendNft = invokeScript(
          {
            version: 1,
            additionalFee: 400000,
            dApp: dapp,
            call: {
              function: "exportMantles",
              args: [{ type: "string", value: idString }],
            },
            payment: [],
          },
          seed
        );

        broadcast(sendNft).catch((e) => console.log(JSON.stringify(e)));

        ids = [];
      }
    }
  });
}

getCall();
