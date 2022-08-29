const DappUtils = require("./utils/dapp.utils");
const dappUtils = new DappUtils();
const accountUtils = require("./utils/account.utils");

describe("ducks - setup smart contracts", () => {
  before(async function () {
    this.timeout(0);
    await accountUtils.defineAccounts({
      "collective-farms": 0.1,
      "cf-staking": 0.1, //= f_{{CF}}_stake_address
      masterSeed: 0.1, // example = https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
    });

    await dappUtils.issueTestAsset();
    await dappUtils.setupDapp("collective-farms");
    await dappUtils.setupDapp("cf-staking");

    //TODO: compose correct data to send to masterSeed (preferable with helper function)
  });
  describe("Try init CF", () => {
    it("initCollectiveFarm", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address("collective-farms"),
          call: {
            function: "initCollectiveFarm",
            args: [
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
