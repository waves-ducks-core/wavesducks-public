const wvs = 10 ** 8;

//const cfSeed = env.cfSeed;
const cfSeed = "";
if (cfSeed == null) {
  throw new Error(`Please provide dappSedd`);
}

//const userSeed = env.userSeed;
const userSeed = "";
if (userSeed == null) {
  throw new Error(`Please provide userSeed`);
}

//const masterSeed = env.masterSeed;
const masterSeed = "";
if (masterSeed == null) {
  throw new Error(`Please provide masterSeed`);
}

//const cfStakingSeed = env.cfStakingSeed;
const cfStakingSeed = "";
if (cfStakingSeed == null) {
  throw new Error(`Please provide cfStakingSeed`);
}

describe("cf test suite", async function () {
  this.timeout(100000);

  before(async function () {});

  describe("Try to do outgoing tx", () => {
    it("outgoing transfer is not allowed by sc", async function () {
      const txTransfer = transfer(
        {
          amount: 1,
          recipient: address(cfSeed),
          additionalFee: 400000,
        },
        cfSeed
      );
      await expect(broadcast(txTransfer)).rejectedWith(
        "Transaction is not allowed by account-script"
      );
    });
    it("Cannot invoke unknown dapp", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: "3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo",
          call: {
            function: "withdraw",
            args: [
              { type: "string", value: "3PMj3yGPBEa1Sx9X4TSBFeJCMMaE3wvKR4N" },
              { type: "integer", value: 980571 },
              {
                type: "string",
                value: "3RGfy6Q5AEQ5Aby3CGRndpsyFZ4j8znr1W6Zge9m9trC",
              },
            ],
          },
          additionalFee: 400000,
        },
        cfSeed
      );
      await expect(broadcast(invoke)).rejectedWith(
        "Transaction is not allowed by account-script"
      );
    });
    it("Cannot change masterKey once set", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfSeed),
          call: {
            function: "initMasterKey",
            args: [
              { type: "string", value: "3PMj3yGPBEa1Sx9X4TSBFeJCMMaE3wvKR4N" },
            ],
          },
          additionalFee: 400000,
        },
        cfSeed
      );
      await expect(broadcast(invoke)).rejectedWith(
        "Transaction is not allowed by account-script"
      );
    });
    describe("Cannot directly call ", () => {
      it("calculateCompoundShareAndIssue", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "calculateCompoundShareAndIssue",
              args: [{ type: "integer", value: 250 }],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("unstakeNFT", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "unstakeNFT",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "You cannot call these functions directly"
        );
      });
      it("unstakeJackpot", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "unstakeJackpot",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "You cannot call these functions directly"
        );
      });
      it("initCollectiveFarm", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "initCollectiveFarm",
              args: [
                { type: "string", value: "arguments" },
                { type: "integer", value: 250 },
              ],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("setLock", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "setLock",
              args: [{ type: "boolean", value: true }],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("provideLiquidity", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "provideLiquidity",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("claimFarmingRewardProxy", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "claimFarmingRewardProxy",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("startLiquidation", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "startLiquidation",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("voteForLiquidation", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "voteForLiquidation",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Transaction is not allowed by account-script"
        );
      });
      it("claimReward", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "claimReward",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Error while executing account-script: _16"
        );
      });
    });
    describe("Make sure a CF can only 1 time be started", () => {
      it("initCollectiveFarm", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "initCollectiveFarm",
              args: [
                { type: "string", value: "arguments" },
                { type: "integer", value: 250 },
              ],
            },
            additionalFee: 400000,
          },
          masterSeed
        );
        await expect(broadcast(invoke)).rejectedWith(
          "Error while executing account-script: _2"
        );
      });
    });
    describe("Make sure a CF can put a duck on perch and remove it", () => {
      it("remove duck from perch", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "callUnstakeProxy",
              args: [
                { type: "string", value: "unstakeNFT" },
                {
                  type: "string",
                  value: "AkVMrqVFCXhDB6CeA5hHVykU31sreMhsGmnSmLcscD1U",
                },
              ],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await broadcast(invoke);
        const output = await waitForTx(invoke.id);
        await expect(output.stateChanges.invokes[0].dApp).to.equal(
          "3PH75p2rmMKCV2nyW4TsAdFgFtmc61mJaqA"
        );
        await expect(output.stateChanges.invokes[1].dApp).to.equal(
          "3P2dfhgUswGVaJeseCj3kj7ZxXAYSv2e5Hj"
        );
        await expect(output.stateChanges.invokes[2].dApp).to.equal(
          "3PBjiMHNTqqcee1phQhv6GhHWc1XsANJ252"
        );
      });
      it("put duck on perch", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: "3PH75p2rmMKCV2nyW4TsAdFgFtmc61mJaqA",
            call: {
              function: "stakeNFT",
              args: [],
            },
            payment: [
              {
                amount: 1,
                assetId: "AkVMrqVFCXhDB6CeA5hHVykU31sreMhsGmnSmLcscD1U",
              },
            ],
            additionalFee: 400000,
          },
          cfSeed
        );
        await broadcast(invoke);
        const output = await waitForTx(invoke.id);
        await expect(output.applicationStatus).to.equal("succeeded");
      });
    });
    describe("Lock and unlock investments", () => {
      it("by owner", async function () {
        const invokeLock = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "lockInvestments",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await broadcast(invokeLock);
        await waitForTx(invokeLock.id);
        const invokeUnlock = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "unlockInvestments",
              args: [],
            },
            additionalFee: 400000,
          },
          cfSeed
        );
        await broadcast(invokeUnlock);
        await waitForTx(invokeUnlock.id);
      });
      it("by outsider should fail", async function () {
        const invokeLock = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "lockInvestments",
              args: [],
            },
            additionalFee: 400000,
          },
          masterSeed
        );
        await expect(broadcast(invokeLock)).rejectedWith(
          "You cannot lock this contract"
        );
        const invokeUnlock = invokeScript(
          {
            version: 1,
            dApp: address(cfSeed),
            call: {
              function: "unlockInvestments",
              args: [],
            },
            additionalFee: 400000,
          },
          masterSeed
        );
        await expect(broadcast(invokeUnlock)).rejectedWith(
          "You cannot lock this contract"
        );
      });
    });
  });
});
