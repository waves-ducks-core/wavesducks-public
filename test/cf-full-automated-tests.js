const DappUtils = require("./utils/dapp.utils");
const AccountUtils = require("./utils/account.utils");

const dappUtils = new DappUtils();
const accountUtils = new AccountUtils();
const AMOUNT_OF_EGG_REQUIRED = 100_000_000; // More than actually required.
const AMOUNT_OF_SHARE_ASSET_STAKED = 10_000_000;
const VOTE_DURATION_IN_BLOCKS = 1;

describe("ducks - collective farms - test smart contracts", () => {
  before(async () => {
    // Provide a rough required amount of Waves for each account in order to be able to pay.
    const accountRecords = {
      oracle: 1.5,
      collectiveFarm: 0.1,
      collectiveFarmStaking: 0.1, //= f_{{CF}}_stake_address
      // Collective farms use a master seed that can be used to track all transaction info etc.
      // example: https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
      // NOTE: This account also gets used as a user account in the tests.
      collectiveFarmMasterSeed: 1.5,
      coupons: 0.1
    }

    await accountUtils.defineAccounts(accountRecords); // Preserved variable 'accounts' contains all defined accounts.
    await dappUtils.issueTestAsset(accounts.oracle);
    await dappUtils.setupDapp(accounts.collectiveFarm);
    await dappUtils.setupDapp(accounts.collectiveFarmStaking);
    await dappUtils.setupDapp(accounts.coupons);

    // Create required data for correct workings of the smart contracts.
    const oracleDataTx = data(
      {
        data: [
          // Required for the coupons smart contract to work.
          {
            type: "string",
            value: address(accounts.collectiveFarmMasterSeed),
            key: "static_cfMasterAddress"
          }
        ]
      },
      accounts.oracle
    );

    const masterSeedDataTx = data(
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
          },
          // Required for the coupons smart contract to work.
          {
            type: "string",
            value: address(accounts.coupons),
            key: "COUPONS_ADDRESS"
          },
          // Set vote duration (in blocks) in order to be able to test voting in a short time frame.
          {
            type: "integer",
            value: VOTE_DURATION_IN_BLOCKS,
            key: "VOTE_DURATION"
          },
          // Required for the coupons smart contract to work.
          {
            type: "string",
            value: address(accounts.collectiveFarm),
            key: "CF_ADDRESS"
          }
        ],
      },
      accounts.collectiveFarmMasterSeed
    );

    const couponsDataTx = data(
      {
        data: [
          // Required for the coupons smart contract to work.
          {
            type: "string",
            value: address(accounts.oracle),
            key: "static_oracleAddress"
          }
        ]
      },
      accounts.coupons
    );

    await Promise.all([
      broadcastAndWaitForResponse(oracleDataTx),
      broadcastAndWaitForResponse(masterSeedDataTx),
      broadcastAndWaitForResponse(couponsDataTx)
    ])

    // Transfer generated assets from the oracle to the collectiveFarmMasterSeed in order to be able to pay when needed.
    // NOTE: As mentioned above, this account also gets used as a user account in the tests, so it also uses assets for user functionality.
    const transferTx = transfer(
      {
        amount: AMOUNT_OF_EGG_REQUIRED,
        assetId: dappUtils.eggAssetId,
        recipient: address(accounts.collectiveFarmMasterSeed),
      },
      accounts.oracle
    );

    await broadcastAndWaitForResponse(transferTx);
  })

  describe("collectiveFarm - complete flow", () => {
    describe("initMasterKey", () => {
      it("should initialize the master key", async () => {
        const functionArgs = [
          {
            type: "string",
            value: publicKey(accounts.collectiveFarmMasterSeed)
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgs, 400_000);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgs, 400_000);
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
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "initCollectiveFarm", accounts.collectiveFarmMasterSeed, functionArgs, 100_000_000, paymentObjects);
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
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
      });

      it("should set value to false", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
      });
    });

    describe("lockInvestments", () => {
      it("should lock the investments", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarm, "lockInvestments", accounts.collectiveFarm, undefined, 400_000);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "lockInvestments", accounts.collectiveFarm, undefined, 400_000);
      });
    });

    describe("unlockInvestments", () => {
      it("should unlock the investments", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarm, "unlockInvestments", accounts.collectiveFarm, undefined, 400_000);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "unlockInvestments", accounts.collectiveFarm, undefined, 400_000);
      });
    });

    describe("provideLiquidity", () => {
      it("should provide liquidity to the farm", async () => {
        const paymentObjects = [{
          assetId: dappUtils.eggAssetId,
          amount: 1_000_000,
        }];

        const invoke = buildInvokeScript(accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
      });
    });

    // TODO: expand tests to cover all functionality in the 'collectiveFarm' contract
    // describe("", () => {
    //   it("", async () => {

    //   });
    // });
  });

  describe("collectiveFarmStaking - complete flow", () => {
    describe("initiateDapp", () => {
      it("should set the address and initiate", async () => {
        const functionArgs = [
          {
            type: "string",
            value: address(accounts.collectiveFarm)
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);
      });
    });

    describe("voteToLiquidate", () => {
      it("should not be able to vote before staking assets", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        const errorMessage = "CVTL: Please stake some tokens before you can vote!";

        broadcastAndRejected(invoke, errorMessage);
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
            amount: AMOUNT_OF_SHARE_ASSET_STAKED,
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
      });
    });

    describe("withdrawFarmTokens", () => {
      it("should withdraw farm tokens", async () => {
        const functionArgs = [
          {
            type: "integer",
            // Half of staked amount
            value: (AMOUNT_OF_SHARE_ASSET_STAKED / 2)
          },
          {
            type: "boolean",
            value: false
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);
      });
    });

    describe("topUpReward", () => {
      it("should add assets to the farm", async () => {
        const paymentObjects = [
          {
            assetId: dappUtils.eggAssetId,
            amount: 1_000_000
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
      });
    });

    describe("claimReward", () => {
      it("should claim farm staking rewards", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
      });
    });

    describe("startVote", () => {
      it("should not start a vote if wrong function arguments are provided", async () => {
        const invoke = buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
        const errorMessage = "function 'startVote takes 0 args but 1 were(was) given";

        broadcastAndRejected(invoke, errorMessage);
      });

      it("should not start a vote if the invocation is not sent by the master seed account", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.oracle);
        const errorMessage = "CSV: Only the admin can start a liquidation vote for now!";

        broadcastAndRejected(invoke, errorMessage);
      });

      it("should start a vote", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
        const txResponse = await broadcastAndWaitForResponse(invoke);
        const dataByKey = await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking));

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
        expect(dataByKey).to.eql({
          key: 'VOTE_HEIGHT_START',
          type: 'integer',
          value: txResponse["height"]
        });
      });

      it("should not start a vote if one is already active", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
        const errorMessage = "CSV: There is already a vote running!";

        broadcastAndRejected(invoke, errorMessage);
      });
    });


    describe("voteToLiquidate", () => {
      it("should add a vote", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: true
          }
        ];

        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
      });

      it("should not be able to change a vote", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        const errorMessage = "CVTL: You can not change your vote!";

        broadcastAndRejected(invoke, errorMessage);
      });
    });

    describe("finalizeVote", () => {
      // TODO: Fix this test, it can not run before 'before', so change order or something
      // it("should not finish the voting if the voting period is not finished", async () => {
      //   const invoke = buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
      //   const errorMessage = "CFV: Voting is not finished!";

      //   broadcastAndRejected(invoke, errorMessage);
      // });

      before(async () => {
        await waitNBlocks(VOTE_DURATION_IN_BLOCKS);
      });

      it("should not finish the voting if wrong function arguments are provided", async () => {
        const invoke = buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
        const errorMessage = "function 'finalizeVote takes 0 args but 1 were(was) given";

        broadcastAndRejected(invoke, errorMessage);
      });

      it("should finish the voting", async () => {
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
        const txResponse = await broadcastAndWaitForResponse(invoke);

        verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
      });
    });

    describe("voteToLiquidate", () => {
      before(async () => {
        // Wait until 1 block after voting has passed
        await waitNBlocks(1);
      });

      it("should not be able to vote after the voting period is finished", async () => {
        const functionArgs = [
          {
            type: "boolean",
            value: false
          }
        ];
        const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        const errorMessage = "CVTL: Voting is finished, please finalize the vote!";

        broadcastAndRejected(invoke, errorMessage);
      });
    });

    describe.skip("Temporary skipped", () => {
      // Assume coupons gets fully tested somewhere else (technically this could be a 'before')
      describe("coupons - included - collectiveFarmStaking complete flow", () => {
        describe("configureOracle", () => {
          it("should configure the oracle for the coupons smart contract", async () => {
            const functionArgs = [
              {
                type: "string",
                value: address(accounts.oracle)
              }
            ];

            const invoke = buildInvokeScript(accounts.coupons, "configureOracle", accounts.coupons, functionArgs);
            const txResponse = await broadcastAndWaitForResponse(invoke);

            verifyTxResponse(txResponse, accounts.coupons, "configureOracle", accounts.coupons, functionArgs);
          });
        });
      });

      describe("claimRefundStaked", () => {
        it("should refund staked assets", async () => {
          const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);
          const txResponse = await broadcastAndWaitForResponse(invoke);

          verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);
        });
      });

      describe("claimRefundUnstaked", () => {
        it("should refund unstaked assets", async () => {
          const SHARE_ASSET_ID = (await accountDataByKey("SHARE_ASSET_ID", address(accounts.collectiveFarm)))["value"];
          const paymentObjects = [
            {
              assetId: SHARE_ASSET_ID,
              // Half of staked amount
              amount: (AMOUNT_OF_SHARE_ASSET_STAKED / 2)
            }
          ];

          const invoke = buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundUnstaked", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
          const txResponse = await broadcastAndWaitForResponse(invoke);

          verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimRefundUnstaked", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        });
      });
    });
  });
});

async function broadcastAndWaitForResponse(transaction) {
  const promises = (await Promise.all([
    broadcast(transaction),
    waitForTx(transaction.id)
  ]));

  // Return value gets ignored when not needed.
  return promises[1];
}

async function broadcastAndRejected(transaction, errorMessage, customMessage) {
  if (!customMessage) {
    await expect(broadcast(transaction)).rejectedWith("Error while executing account-script: " + errorMessage);
  } else {
    await expect(broadcast(transaction)).rejectedWith(errorMessage);
  }
}

function buildInvokeScript(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray) {
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

// Only use this when no arguments are expected, otherwise provide correct argument types with wrong values
// Reason: type checking happens on chain -> not our concern
function buildInvokeScriptWithWrongFunctionArgs(dAppToCallSeed, functionToCall, callSeed, additionalFeeValue, paymentObjectsAsArray) {
  const functionArgs = [{
    type: "string",
    value: "This is wrong"
  }];

  return buildInvokeScript(dAppToCallSeed, functionToCall, callSeed, functionArgs, additionalFeeValue, paymentObjectsAsArray);
}

// TODO: add later when other checks are implemented
// function buildInvokeScriptWithWrongPaymentObjects(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue) {
//   const paymentObjects = [{
//     assetId: dappUtils.eggAssetId,
//     amount: 10_000_000
//   }];

//   return buildInvokeScript(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjects);
// }

function verifyTxResponse(txResponse, dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray) {
  const DEFAULT_FEE = 500_000;

  expect(txResponse["dApp"]).to.equal(address(dAppToCallSeed));
  expect(txResponse["call"]["function"]).to.equal(functionToCall);
  expect(txResponse["call"]["args"]).to.eql(functionArgsAsArray ? functionArgsAsArray : []);
  expect(txResponse["sender"]).to.equal(address(callSeed));
  expect(txResponse["fee"]).to.equal(DEFAULT_FEE + (additionalFeeValue ? additionalFeeValue : 0));
  expect(txResponse["payment"]).to.eql(paymentObjectsAsArray ? paymentObjectsAsArray : []);
}

// TODO: integrate this function later
async function buildSendVerifyTx(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray) {
  const invoke = buildInvokeScript(dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray);
  const txResponse = await broadcastAndWaitForResponse(invoke);

  verifyTxResponse(txResponse, dAppToCallSeed, functionToCall, callSeed, functionArgsAsArray, additionalFeeValue, paymentObjectsAsArray);
}
