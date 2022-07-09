let items = require("./items.json");

console.log(Object.keys(items).length);
seed = "";

var count = 0;
for (var key in items) {
  if (items.hasOwnProperty(key)) {
    const compTx = invokeScript(
      {
        version: 1,
        additionalFee: 400000,
        dApp: "3P5W1D4UuSZrNfeZFJZcD5wT2avfbHbzTvS",
        call: {
          function: "addCoupons",
          args: [
            { type: "string", value: key },
            { type: "integer", value: items[key] * 3_0000_0000 },
          ],
        },
      },
      seed
    );
    count++;
    broadcast(compTx).catch((e) => console.log(JSON.stringify(e)));
    waitForTx(compTx.id);

    console.log(key + " -> " + items[key]);
    console.log(count);
  }
}
