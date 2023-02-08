const axios = require("axios");
const seed = "";

(async () => {
  axios({
    method: "get",
    url: "https://node.turtlenetwork.eu/addresses/data/3PKmLiGEfqLWMC1H9xhzqvAZKUXfFm8uoeg?matches=.%2A_level",
  }).then(({ data }) => {
    console.log(data);
    let allDucklings = data;
    (async () => {
      axios({
        method: "get",
        url: "https://node.turtlenetwork.eu/addresses/data/3PKmLiGEfqLWMC1H9xhzqvAZKUXfFm8uoeg?matches=.%2A_grown",
      }).then(async ({ data }) => {
        assetIdArrayAll = allDucklings.map((obj) => obj["key"].split("_")[1]);
        assetIdArrayGrown = data.map((obj) => obj["key"].split("_")[1]);

        let unique1 = assetIdArrayAll.filter(
          (o) => assetIdArrayGrown.indexOf(o) === -1
        );
        console.log(unique1);

        var shortArrays = [],
          i,
          len;

        for (i = 0, len = unique1.length; i < len; i += 10) {
          shortArrays.push(unique1.slice(i, i + 10));
        }
        for (i = 0, len = shortArrays.length; i < len; i++) {
          const arrayString = shortArrays[i].join();
          const unstake = invokeScript(
            {
              version: 1,
              additionalFee: 400000,
              dApp: "3PKmLiGEfqLWMC1H9xhzqvAZKUXfFm8uoeg",
              call: {
                function: "fixLevels",
                args: [{ type: "string", value: arrayString }],
              },
            },
            seed
          );

          await broadcast(unstake);
        }
      });
    })();
  });
})();
