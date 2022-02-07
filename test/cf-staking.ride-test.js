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

describe("cf staking test suite", async function () {
  this.timeout(100000);

  before(async function () {});

  describe("Make sure only dapp itself can initiatie it", () => {
    it("try initiate dapp as outsider", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfStakingSeed),
          call: {
            function: "initiateDapp",
            args: [{ type: "string", value: address(cfSeed) }],
          },
          additionalFee: 400000,
        },
        masterSeed
      );
      await expect(broadcast(invoke)).rejectedWith(
        "Error while executing account-script: Can be called only by the dapp-account"
      );
    });
    it("try initiate dapp as the dapp itself", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfStakingSeed),
          call: {
            function: "initiateDapp",
            args: [{ type: "string", value: address(cfSeed) }],
          },
          additionalFee: 400000,
        },
        cfStakingSeed
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
  });

  describe("stake,unstake,claimreward", () => {
    it("try to stake 2 farm tokens", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfStakingSeed),
          call: {
            function: "stakeFarmTokens",
            args: [{ type: "boolean", value: false }],
          },
          payment: [
            {
              assetId: "ApNJp5xHXPdRP2BkC5raxC76PAzEoDfak5R1adwnxXzg",
              amount: 200000000,
            },
          ],
        },
        userSeed
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
    it("try to claim reward", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfStakingSeed),
          call: {
            function: "claimReward",
            args: [],
          },
        },
        userSeed
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
    describe("wd farm tokens", () => {
      it("by amount", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfStakingSeed),
            call: {
              function: "withdrawFarmTokens",
              args: [
                { type: "integer", value: 100000000 },
                { type: "boolean", value: false },
              ],
            },
          },
          userSeed
        );
        await broadcast(invoke);
        await waitForTx(invoke.id);
      });
      it("by amount -1", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfStakingSeed),
            call: {
              function: "withdrawFarmTokens",
              args: [
                { type: "integer", value: -1 },
                { type: "boolean", value: false },
              ],
            },
          },
          userSeed
        );
        await broadcast(invoke);
        await waitForTx(invoke.id);
      });
    });
  });
  describe("compound: stake,unstake", () => {
    it("try to stake 2 farm tokens", async function () {
      const invoke = invokeScript(
        {
          version: 1,
          dApp: address(cfStakingSeed),
          call: {
            function: "stakeFarmTokens",
            args: [{ type: "boolean", value: true }],
          },
          payment: [
            {
              assetId: "ApNJp5xHXPdRP2BkC5raxC76PAzEoDfak5R1adwnxXzg",
              amount: 200000000,
            },
          ],
        },
        userSeed
      );
      await broadcast(invoke);
      await waitForTx(invoke.id);
    });
    describe("wd farm tokens", () => {
      it("by amount", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfStakingSeed),
            call: {
              function: "withdrawFarmTokens",
              args: [
                { type: "integer", value: 100000000 },
                { type: "boolean", value: true },
              ],
            },
          },
          userSeed
        );
        await broadcast(invoke);
        await waitForTx(invoke.id);
      });
      it("by amount -1", async function () {
        const invoke = invokeScript(
          {
            version: 1,
            dApp: address(cfStakingSeed),
            call: {
              function: "withdrawFarmTokens",
              args: [
                { type: "integer", value: -1 },
                { type: "boolean", value: false },
              ],
            },
          },
          userSeed
        );
        await broadcast(invoke);
        await waitForTx(invoke.id);
      });
    });
  });
});
