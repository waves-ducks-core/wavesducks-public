const axios = require("axios");
const seed = "";
(async () => {
  axios({
    method: "get",
    url: "https://node.turtlenetwork.eu/addresses/data/3PKmLiGEfqLWMC1H9xhzqvAZKUXfFm8uoeg?matches=.%2A_start.%2A",
  }).then(({ data: data1 }) => {
    console.log(data1);
    let allDucklings = data1;

    let unique1 = allDucklings
      .filter((o) => [20, 40, 80].includes(o["value"]))
      .map((o) => ({
        ...o,
        value: o["value"] / 5,
      }));
    console.log(unique1);

    var shortArrays = [],
      i,
      len;

    for (i = 0, len = unique1.length; i < len; i += 90) {
      shortArrays.push(unique1.slice(i, i + 90));
    }
    for (i = 0, len = shortArrays.length; i < len; i++) {
      const dataTx = data(
        {
          additionalFee: 500000,
          data: shortArrays[i],
        },
        seed
      );
      console.log(dataTx);
      broadcast(dataTx).catch((e) => console.log(e));
    }
  });
})();
