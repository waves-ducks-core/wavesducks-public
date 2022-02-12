const axios = require("axios");

//0) First CF to migrate: Duxplorer, Math, Turtle, eggseggs, pesolatino, fomo, mundo, eggpoint
//0) Second CF to migrate: Endo, Marvin, eggmoon, street, kolhkoz, forklog, cgu

//1) Pre requirements: Deployed CF sc on new address (done by user) (13th/14th)
//2) Cf needs to have invoked: initMasterKey (done by user) (13/14th)
//3) deployed staking sc on new address (done by ducks team) (13/14th)
//4) Cf staking dapp needs to be initialized with cf address (done by ducks team)  (13/14th)
//5) take all ducks out perches, breeding, incubator,.... (done by user) (15th)
//5) Make sure to have all ceo fee claimed (15th)
//5) Make sure to have enough waves fee available (15th)

//6) Vova will disable pool by pool (15th/16th)
//6) Inal will run the final payments for the CF's that will be migrated that day. (15th)

//7) run this script (edit the params correctly!!!!) (done by ducks team) (16th)
//8) check old cf is empty, check that all assets migrated (done by ducks team) (16th)
//9) run airdrop script to airdorp new tokens(16th)

const cfAddress = "3P2dfhgUswGVaJeseCj3kj7ZxXAYSv2e5Hj";
//old CF
const cfPublicKey = "B3nAk9hER1sVM4CAFi7rfex69eZ4vKBhFLynWAejx49c";
//new token name CF
const name = "CFMIGRATIONTEST";
const newCFAddress = "3P94jwfaQAm4BEWsBmHV96kBKTf7dp2FHJV";
const newCFStakeAddress = "3P69m61RVNDJdE11qT7CC5tquXT5XRQvbwy";

const masterSeed = "";
const farmSeed = "";
const farmDapp = "3PH75p2rmMKCV2nyW4TsAdFgFtmc61mJaqA";
const newMasterSeed = masterSeed;

//Fail script if still ducks on perches
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
    for (let i = 0; i < data.length; i++) {
      if (data[i].value != 0) {
        console.log("Still ducks on perches, halt migration!");
        process.exit(1);
      }
    }
  });
})();

const lockOldFarm = invokeScript(
  {
    version: 1,
    dApp: cfAddress,
    call: {
      additionalFee: 400000,
      function: "setLock",
      args: [{ type: "boolean", value: true }],
    },
  },
  masterSeed
);

broadcast(lockOldFarm).catch((e) => console.log(e));

//Transfer old perches
(async () => {
  axios({
    method: "get",
    url:
      "https://node.turtlenetwork.eu/addresses/data/" +
      farmDapp +
      "?matches=address_" +
      cfAddress +
      "_perchesAvailable_.%2A",
  }).then(({ data: dataO }) => {
    const newList = [];
    for (let i = 0; i < dataO.length; i++) {
      const item = {
        key: dataO[i].key.replace(cfAddress, newCFAddress),
        type: dataO[i].type,
        value: dataO[i].value,
      };
      const oldItem = {
        key: dataO[i].key,
        value: null,
      };
      newList.push(item);
      newList.push(oldItem);
    }
    console.log(newList);
    const dataTx = data(
      {
        additionalFee: 400000,
        data: newList,
      },
      farmSeed
    );
    broadcast(dataTx).catch((e) => console.log(e));
  });
})();

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
          transfers: [{ recipient: newCFAddress, amount: 1 }],
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      broadcast(SignedTx).catch((e) => console.log(e));
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
              recipient: newCFAddress,
              amount: data.balances[i]["balance"],
            },
          ],
        },
        null
      );
      let SignedTx = signTx(massTx, masterSeed);
      broadcast(SignedTx).catch((e) => console.log(e));
    }
  });
})();
//Send over waves
(async () => {
  axios({
    url: "https://cluster.node.turtlenetwork.eu/addresses/balance/" + cfAddress,
  }).then(({ data }) => {
    const massTx = massTransfer(
      {
        additionalFee: 400000,
        senderPublicKey: cfPublicKey,
        transfers: [
          {
            recipient: newCFAddress,
            amount: data["balance"] - 600000,
          },
        ],
      },
      null
    );
    let SignedTx = signTx(massTx, masterSeed);
    broadcast(SignedTx).catch((e) => console.log(e));
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

function getDetailsCall(assetId) {
  return axios({
    method: "get",
    async: false,
    url: "https://node.turtlenetwork.eu/assets/details/" + assetId,
  });
}

//make sure correct data is in masterseed
const dataTx = data(
  {
    additionalFee: 400000,
    data: [
      { type: "integer", key: "f_" + newCFAddress + "_fee", value: "10" },
      {
        type: "string",
        key: "f_" + newCFAddress + "_stake_address",
        value: newCFStakeAddress,
      },
      {
        type: "boolean",
        key: "farm_" + newCFAddress,
        value: true,
      },
    ],
  },
  newMasterSeed
);
broadcast(dataTx).catch((e) => console.log(e));

//move over data and create tokens
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

  const { data: shareAssetID } = await getCall(cfAddress, "SHARE_ASSET_ID");
  this.shareAssetID = shareAssetID.value;

  const { data: circulating } = await getDetailsCall(this.shareAssetID);
  this.circulating = circulating.quantity;

  console.log("1: ", this.minimumThreshold);
  console.log("2: ", this.totalFarmingReward);
  console.log("3: ", this.totalLiquidity);
  console.log("4: ", this.shareAssetID);
  console.log("5: ", this.circulating);

  const initCF = invokeScript(
    {
      version: 1,
      additionalFee: 100400000,
      dApp: newCFAddress,
      call: {
        function: "initCollectiveFarm",
        args: [
          { type: "string", value: name },
          { type: "integer", value: this.minimumThreshold },
          { type: "boolean", value: true },
          { type: "integer", value: this.totalFarmingReward },
          { type: "integer", value: this.totalLiquidity },
          { type: "integer", value: this.circulating },
        ],
      },
    },
    newMasterSeed
  );

  initCF.catch((e) => console.log(e));
}

getData();
