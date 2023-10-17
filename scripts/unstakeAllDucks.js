const axios = require("axios");
const cfAddress = "";
const senderPublicKey = "";
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
