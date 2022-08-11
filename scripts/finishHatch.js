SEED = "";
const axios = require("axios");
const incubator = "3PEktVux2RhchSN63DsDo4b4mz4QqzKSeDv";

(async () => {
  axios({
    method: "get",
    url:
      "https://node.turtlenetwork.eu/addresses/data/" +
      incubator +
      "?matches=.%2A_status",
  }).then(({ data }) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i]["value"] == "HATCHING_STARTED") {
        if ("" != data[i]["key"].split("_")[0]) {
          console.log(data[i]["key"].split("_"));
          const finishHatch = invokeScript(
            {
              version: 1,
              additionalFee: 400000,
              dApp: incubator,
              call: {
                function: "finishDuckHatchingAdmin",
                args: [
                  { type: "string", value: data[i]["key"].split("_")[1] },
                  { type: "string", value: data[i]["key"].split("_")[0] },
                ],
              },
            },
            SEED
          );
          console.log(finishHatch);

          broadcast(finishHatch).catch((e) => console.log(JSON.stringify(e)));
          waitForTx(finishHatch.id);
        }
      }
    }
  });
})();
