const DappUtils = require("./utils/dapp.utils");
const AccountUtils = require("./utils/account.utils");

const AMOUNT_OF_EGG_REQUIRED = 100_000_000; // More than actually required.
const dappUtils = new DappUtils();
const accountUtils = new AccountUtils();

describe("ducks - collective farms - collectiveFarmStaking - complete flow", () => {
  before(async () => {
    // Setup required accounts, assets and dApps.
    // Provide a rough required amount of Waves for each account in order to be able to pay.
    const accountRecords = {
      oracle: 1.5,
      eggStaking: 0.1,
      userSeed: 1,
    };

    await accountUtils.defineAccounts(accountRecords); // Preserved variable 'accounts' contains all defined accounts.
    await dappUtils.issueTestAsset(accounts.oracle);
    await dappUtils.setupDapp(accounts.eggStaking);

    // Setup required data for correct workings of the smart contracts.
    const oracleDataTx = data(
      {
        data: [
          // Required for the coupons smart contract to work.
          {
            type: "string",
            value: dappUtils.eggAssetId,
            key: "static_eggAssetId",
          },
        ],
      },
      accounts.oracle
    );

    await Promise.all([dappUtils.broadcastAndWaitForResponse(oracleDataTx)]);

    const transferTx = transfer(
      {
        amount: AMOUNT_OF_EGG_REQUIRED,
        assetId: dappUtils.eggAssetId,
        recipient: address(accounts.userSeed),
      },
      accounts.oracle
    );

    await dappUtils.broadcastAndWaitForResponse(transferTx);
  });

  describe("initiateDapp - setup dapp", () => {
    it("should configure the oracle", async () => {
      const functionArgs = [
        {
          type: "string",
          value: address(accounts.oracle),
        },
      ];
      const invoke = dappUtils.buildInvokeScript(
        accounts.eggStaking,
        "configureOracle",
        accounts.eggStaking,
        functionArgs
      );
      const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

      dappUtils.verifyTxResponse(
        txResponse,
        accounts.eggStaking,
        "configureOracle",
        accounts.eggStaking,
        functionArgs
      );

      const dataByKey = await accountDataByKey(
        "static_oracleAddress",
        address(accounts.eggStaking)
      );

      expect(dataByKey).to.eql({
        key: "static_oracleAddress",
        type: "string",
        value: address(accounts.oracle),
      });
    });
  });

  describe("initiateDapp - stake and unstake", () => {
    it("should stake the eggs", async () => {
      const paymentObjects = [
        {
          assetId: dappUtils.eggAssetId,
          amount: AMOUNT_OF_EGG_REQUIRED / 2,
        },
      ];
      const invoke = dappUtils.buildInvokeScript(
        accounts.eggStaking,
        "stakeEgg",
        accounts.userSeed,
        undefined,
        undefined,
        paymentObjects
      );
      const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

      dappUtils.verifyTxResponse(
        txResponse,
        accounts.eggStaking,
        "stakeEgg",
        accounts.userSeed,
        undefined,
        undefined,
        paymentObjects
      );

      const dataByKey = await accountDataByKey(
        "global_staked",
        address(accounts.eggStaking)
      );

      expect(dataByKey).to.eql({
        key: "global_staked",
        type: "integer",
        value: AMOUNT_OF_EGG_REQUIRED / 2,
      });
    });

    it("should unstake the eggs", async () => {
      const functionArgs = [
        {
          type: "integer",
          value: AMOUNT_OF_EGG_REQUIRED / 4,
        },
      ];
      const invoke = dappUtils.buildInvokeScript(
        accounts.eggStaking,
        "withdrawEgg",
        accounts.userSeed,
        functionArgs,
        undefined,
        undefined
      );
      const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

      dappUtils.verifyTxResponse(
        txResponse,
        accounts.eggStaking,
        "withdrawEgg",
        accounts.userSeed,
        functionArgs,
        undefined,
        undefined
      );

      const dataByKey = await accountDataByKey(
        "global_staked",
        address(accounts.eggStaking)
      );

      expect(dataByKey).to.eql({
        key: "global_staked",
        type: "integer",
        value: AMOUNT_OF_EGG_REQUIRED / 4,
      });
    });
  });
});
