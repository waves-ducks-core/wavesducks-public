const DappUtils = require("./utils/dapp.utils");
const dappUtils = new DappUtils();
const accountUtils = require("./utils/account.utils");

// account 'oracle' used in 'issueTestAsset' if defined
const oracle = 'oracle';
// account names used for creating Dapps
const collectiveFarm = 'collective-farm';
const collectiveFarmStaking = 'cf-staking';

describe("ducks - setup smart contracts - good flow", () => {
  before(async function () {
    // TODO: check why this timeout is needed
    this.timeout(0);

    await accountUtils.defineAccounts({
      oracle: 1,
      collectiveFarm: 0.1,
      collectiveFarmStaking: 0.1, //= f_{{CF}}_stake_address
      // TODO: check if master seed is needed, don't think so according to docs?
      // masterSeed: 0.1, // example = https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
    });

    await dappUtils.issueTestAsset();
    await dappUtils.setupDapp(collectiveFarm);
    await dappUtils.setupDapp(collectiveFarmStaking);

    //TODO: compose correct data to send to masterSeed (preferably with helper function)
  });

  describe("Try to initiate collective farm", () => {
    it("should run initCollectiveFarm", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address("collective-farms"),
          call: {
            function: "initCollectiveFarm",
            args: [
              // name: String, minimumThreshold: Int, migration: Boolean, totalFarmingReward: Int,totalLiquidity: Int, totalFarmToken: Int
              // { type: "string", value: "collective-farm-test" },
              // { type: "integer", value: 0 },
              // { type: "boolean", value: false },
              // { type: "integer", value: 0 },
              // { type: "integer", value: 0 },
              // { type: "integer", value: 0 }

              { type: "string", value: "arguments" },
              { type: "integer", value: 250 },
            ],
          },
          additionalFee: 400000,
        },
        "collective-farms"
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
  });
});
