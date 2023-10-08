const axios = require("axios");
const cfAddress = "3P3y8NLGLYDx9obVaBF8je9uPTy2BDaK5n4";
const senderPublicKey = "9TcFVW8VfeAKMMLqKdzKkRswaPBqRS2ih2BYA3dr1yfY";
const masterSeed = "";
const farmDapp = "3PAETTtuW7aSiyKtn9GuML3RgtV1xdq1mQW";

(async () => {
  axios({
    method: "get",
    url:
      "https://node.turtlenetwork.eu/addresses/data/" +
      farmDapp +
      "?matches=address_" +
      cfAddress +
      "_asset_.%2A_farmingPower",
  }).then(({ data }) => {
    list = 0;
    stringList = "";
    for (let i = 0; i < data.length; i++) {
      const key = data[i].key.split("_")[3];
      console.log(key);
      console.log(i);
      console.log(data.length);
      if (data[i].value != 0) {
        list += 1;

        if (list != 1) {
          stringList += ";";
        }

        stringList += key;
        if (list == 5 || i == data.length - 1) {
          console.log(stringList);

          const unstake = invokeScript(
            {
              version: 1,
              additionalFee: 400000,
              senderPublicKey: senderPublicKey,
              dApp: cfAddress,
              call: {
                function: "callUnstakeProxy",
                args: [
                  { type: "string", value: "unstakeNFT" },
                  { type: "string", value: stringList },
                ],
              },
            },
            masterSeed
          );

          broadcast(unstake).catch((e) => console.log(JSON.stringify(e)));

          stringList = "";
          list = 0;
        }
      }
    }
  });
})();
