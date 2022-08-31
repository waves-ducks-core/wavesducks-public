const DappUtils = require("./utils/dapp.utils");
const AccountUtils = require("./utils/account.utils");

const dappUtils = new DappUtils();
const accountUtils = new AccountUtils();
const amountOfEggRequired = 100_000_000; // More than actually required.

describe("ducks - collective farms - test smart contracts", () => {
  before(async function () {
    basicSetup(this);

    // Provide a rough required amount of Waves for each account in order to be able to pay.
    const accountRecords = {
      oracle: 1.5,
      collectiveFarm: 0.1,
      collectiveFarmStaking: 0.1, //= f_{{CF}}_stake_address
      // Collective farms use a master seed that can be used to track all transaction info etc.
      // example: https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
      // NOTE: This account also gets used as a user account in the tests.
      collectiveFarmMasterSeed: 1.5,
    }

    await accountUtils.defineAccounts(accountRecords); // Preserved variable 'accounts' contains all defined accounts.
    await dappUtils.issueTestAsset(accounts.oracle);
    await dappUtils.setupDapp(accounts.collectiveFarm);
    await dappUtils.setupDapp(accounts.collectiveFarmStaking);

    // Create required data for correct workings of the smart contract.
    const dataTx = data(
      {
        data: [
          // The 'collectiveFarm' smart contract checks for this key when trying to retrieve egg asset ID.
          {
            type: "string",
            value: dappUtils.eggAssetId,
            key: "EGG_ASSET_ID"
          },
          // This key is needed for the 'provideLiquidity' function. For testing purposes, value can be the same as 'collectiveFarmMasterSeed'.
          {
            type: "string",
            value: publicKey(accounts.collectiveFarmMasterSeed),
            key: "wars_pk"
          },

          // This links the 'collectiveFarm' dApp to the 'collectiveFarmStaking' dApp.
          {
            type: "string",
            value: address(accounts.collectiveFarmStaking),
            key: `f_${address(accounts.collectiveFarm)}_stake_address`
          }
        ],
      },
      accounts.collectiveFarmMasterSeed
    );

    await broadcastAndWaitForResponse(dataTx);

    // Transfer generated assets from the oracle to the collectiveFarmMasterSeed in order to be able to pay when needed.
    const transferTx = transfer(
      {
        amount: amountOfEggRequired,
        assetId: dappUtils.eggAssetId,
        recipient: address(accounts.collectiveFarmMasterSeed),
      },
      accounts.oracle
    );

    await broadcastAndWaitForResponse(transferTx);
  })

  describe("collectiveFarm - working flow", () => {
    describe("initMasterKey", () => {
      it("should initialize the master key", async () => {
        const functionArgs = [
          {
            type: "string",
            value: publicKey(accounts.collectiveFarmMasterSeed)
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgs, 400_000);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("initCollectiveFarm", () => {
      it("should initialize the farm", async () => {
        const functionArgs = dappUtils.generateCollectiveFarmInitData();
        const paymentObjects = [
          {
            assetId: dappUtils.eggAssetId,
            amount: 10_000_000,
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "initCollectiveFarm", accounts.collectiveFarmMasterSeed, functionArgs, 100_000_000, paymentObjects);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("setLock", () => {
      it("should set value to true", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: true
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
        await broadcastAndWaitForResponse(invoke);
      });

      it("should set value to false", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("lockInvestments", () => {
      it("should lock the investments", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarm, "lockInvestments", accounts.collectiveFarm, undefined, 400_000);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("unlockInvestments", () => {
      it("should unlock the investments", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarm, "unlockInvestments", accounts.collectiveFarm, undefined, 400_000);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("provideLiquidity", () => {
      it("should provide liquidity to the farm", async () => {
        const paymentObjects = [{
          assetId: dappUtils.eggAssetId,
          amount: 1_000_000,
        }];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    // OUT OF SCOPE FOR NOW
    // describe("claimFarmingRewardProxy", () => {
    //   it("should claim the farm rewards", async () => {
    //     const invoke = invokeScript(
    //       {
    //         version: 1,
    //         dApp: address(accounts.collectiveFarm),
    //         call: {
    //           function: "claimFarmingRewardProxy",
    //           args: [
    //             {
    //               type: "string",
    //               value: "id1;id2"
    //             }
    //           ],
    //         },
    //       },
    //       accounts.collectiveFarmMasterSeed
    //     );

    //     await broadcastAndWaitForResponse(invoke);
    //   });
    // });
  });

  describe("collectiveFarmStaking - working flow", () => {
    // before(async () => {
    //   const dataTx = data(
    //   );

    //   await broadcastAndWaitForResponse(dataTx);
    // });

    describe("initiateDapp", () => {
      it("should set the address and initiate", async () => {
        const functionArgs = [
          {
            type: "string",
            value: address(accounts.collectiveFarm)
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("stakeFarmTokens", () => {
      it("should stake farm tokens", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];
        const SHARE_ASSET_ID = (await accountDataByKey("SHARE_ASSET_ID", address(accounts.collectiveFarm)))["value"];
        const paymentObjects = [
          {
            assetId: SHARE_ASSET_ID,
            amount: 10_000_000,
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("startVote", () => {
      it("should start a vote", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    describe("voteToLiquidate", () => {
      it("should add votes", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: true
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        await broadcastAndWaitForResponse(invoke);
      });
    });

    // describe("withdrawFarmTokens", () => {
    //   it("", async () => {

    //   });
    // });

    // describe("", () => {
    //   it("", async () => {

    //   });
    // });
  });
});

function basicSetup(context) {
  // Disable test framework timeout because responses can be slow.
  // TODO: maybe revisit this later, technically having no timeout is not advised
  // also there still seems to be a timeout of 60 seconds, so does this actually do anything?
  context.timeout(0);
}

async function broadcastAndWaitForResponse(transaction) {
  await Promise.all([
    broadcast(transaction),
    waitForTx(transaction.id)
  ]);
}

function buildInvokeScript(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray,) {
  return invokeScript(
    {
      version: 1,
      dApp: address(dAppToCallSeed),
      payment: paymentObjectsAsArray ? paymentObjectsAsArray : [],
      call: {
        function: functionToCall,
        args: functionArgsAsArray ? functionArgsAsArray : [],
      },
      additionalFee: additionalFeeValue ? additionalFeeValue : 0,
    },
    callSeed
  );
}
