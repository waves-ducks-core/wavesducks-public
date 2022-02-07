const axios = require("axios");

const cfAddress = "3P2dfhgUswGVaJeseCj3kj7ZxXAYSv2e5Hj";
const cfPublicKey = "B3nAk9hER1sVM4CAFi7rfex69eZ4vKBhFLynWAejx49c";
const destinationAddress = "3P2dfhgUswGVaJeseCj3kj7ZxXAYSv2e5Hj";
const name = "CFMIGRATIONTEST";
let minimumThreshold = 0; //LIQUIDITY_THRESHOLD
const migration = true;
let totalFarmingReward = 0; //total_farming_reward
const totalLiquidity = 0; //total_liquidity
const totalFarmToken = 0; //we need to calculate based on circulating, taken from assetid  : SHARE_ASSET_ID

const masterSeed = "";

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
      //console.log(data[i]);
      const massTx = massTransfer(
        {
          additionalFee: 400000,
          senderPublicKey: cfPublicKey,
          assetId: data[i]["assetId"],
          transfers: [{ recipient: destinationAddress, amount: 1 }],
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      // broadcast(SignedTx).catch((e) => console.log(e));
    }
  });
})();
//Send over assets
(async () => {
  axios({
    method: "get",
    url: "https://cluster.node.turtlenetwork.eu/assets/balance/" + cfAddress,
  }).then(({ data }) => {
    for (let i = 0; i < data.balances.length; i++) {
      //console.log(data.balances[i]);
      const massTx = massTransfer(
        {
          additionalFee: 400000,
          senderPublicKey: cfPublicKey,
          assetId: data.balances[i]["assetId"],
          transfers: [
            {
              recipient: destinationAddress,
              amount: data.balances[i]["balance"],
            },
          ],
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      //broadcast(SignedTx).catch((e) => console.log(e));
    }
  });
})();

function getCall(address, key) {
  return axios({
    method: "get",
    async: false,
    url:
      "https://cluster.node.turtlenetwork.eu/addresses/data/" +
      address +
      "/" +
      key,
  });
}

async function getData() {
  try {
    const { data: minimumTreshold } = await getCall(
      cfAddress,
      "LIQUIDITY_THRESHOLD"
    );
    this.minimumThreshold = minimumTreshold.value;
  } catch (e) {
    this.minimumThreshold = 0;
  }

  try {
    const { data: totalFarmingReward } = await getCall(
      cfAddress,
      "total_farming_reward"
    );
    this.totalFarmingReward = totalFarmingReward;
  } catch (e) {
    this.totalFarmingReward = 0;
  }

  try {
    const { data: totalLiquidity } = await getCall(
      cfAddress,
      "total_liquidity"
    );
    this.totalLiquidity = totalLiquidity.value * 1000000;
  } catch (e) {
    this.totalLiquidity = 0;
  }

  console.log("1: ", this.minimumThreshold);
  console.log("2: ", this.totalFarmingReward);
  console.log("3: ", this.totalLiquidity);
}

getData();
