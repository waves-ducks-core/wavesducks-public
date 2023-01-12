const axios = require("axios");
const incubator = "3PAETTtuW7aSiyKtn9GuML3RgtV1xdq1mQW";

dataEntries = [];
(async () => {
  axios({
    method: "get",
    url:
      "https://node.turtlenetwork.eu/addresses/data/" +
      incubator +
      "?matches=.%2A_withdrawnAmount",
  }).then(({ data }) => {
    let amount = 0;
    for (let i = 0; i < data.length; i++) {
      let stringFormat = String(data[i].value);
      let sub = stringFormat.substring(0, 5);
      let count = stringFormat.split(sub).length - 1;
      if (count == 2) {
        console.log(data[i].value);
        console.log(data[i].key);
        amount++;

        data[i].value = data[i].value / 1000001;
        dataEntries.push(data[i]);
        console.log(dataEntries);
      }
    }
    console.log(amount);
  });
})();
