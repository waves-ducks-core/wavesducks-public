const DappUtils = require("./utils/dapp.utils");
const dappUtils = new DappUtils();
const accountUtils = require("./utils/account.utils");

describe("ducks - setup smart contracts - good flow", () => {
  before(async function () {
    // TODO: check why this timeout is needed
    this.timeout(0);

    await accountUtils.defineAccounts({
      //oracle: 1,
      collectiveFarm: 0.1,
      //collectiveFarmStaking: 0.1, //= f_{{CF}}_stake_address
      cfMasterSeed: 0.1, // example = https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
    });

    //await dappUtils.issueTestAsset();
    await dappUtils.setupDapp("collectiveFarm");
    //await dappUtils.setupDapp("collectiveFarmStaking");

    //TODO: compose correct data to send to cfMasterSeed (preferably with helper function)
  });

  describe("Try to initiate collective farm", () => {
    it("should run initMasterKey and succeed", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(accounts.collectiveFarm),
          call: {
            function: "initMasterKey",
            args: [{ type: "string", value: publicKey(accounts.cfMasterSeed) }],
          },
          additionalFee: 400000,
        },
        accounts.collectiveFarm
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
  });
});
