const axios = require("axios");

dataEntries = [];
(async () => {
  axios({
    method: "get",
    url: "https://api.wavesplatform.com/v0/transactions/invoke-script?timeStart=1671798227474&timeEnd=1672218547208&dapp=3PDbviVyp8vGmCnnjf2rHT4fpUMYe8XtgSL&function=unstakeDuck&sort=desc&limit=100",
  }).then(({ data }) => {
    console.log(data.data);
    const loopData = data.data;
    for (let i = 0; i < loopData.length; i++) {
      axios({
        method: "get",
        url:
          "https://node.turtlenetwork.eu/transactions/info/" +
          loopData[i].data.id,
      }).then(({ data }) => {
        const txData = data.stateChanges.invokes[0];
        const entry = txData.stateChanges.data.find((obj) =>
          obj.key.includes("_withdrawnAmount")
        );

        entry.value =
          entry.value / 1000001 + txData.stateChanges.transfers[1].amount;
        dataEntries.push(entry);
        console.log(dataEntries);
      });
    }
  });
})();
