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
  });
});
