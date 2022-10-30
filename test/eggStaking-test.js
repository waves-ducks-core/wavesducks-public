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

  describe("Stake - stake and unstake", () => {
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

      const dataByKeyGlobalStaked = await accountDataByKey(
        "global_staked",
        address(accounts.eggStaking)
      );

      expect(dataByKeyGlobalStaked).to.eql({
        key: "global_staked",
        type: "integer",
        value: AMOUNT_OF_EGG_REQUIRED / 4,
      });

      const dataByKeyEggStaked = await accountDataByKey(
        address(accounts.userSeed) + "_egg_staked",
        address(accounts.eggStaking)
      );

      expect(dataByKeyEggStaked).to.eql({
        key: address(accounts.userSeed) + "_egg_staked",
        type: "integer",
        value: AMOUNT_OF_EGG_REQUIRED / 4,
      });
    });
  });

  describe("Vote - start vote, vote yes", () => {
    it("should start the vote", async () => {
      const identifier = "TEST-IDENTIFIER";
      const functionArgs = [
        {
          type: "string",
          value: identifier,
        },
      ];
      const invoke = dappUtils.buildInvokeScript(
        accounts.eggStaking,
        "startVote",
        accounts.oracle,
        functionArgs
      );
      const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

      dappUtils.verifyTxResponse(
        txResponse,
        accounts.eggStaking,
        "startVote",
        accounts.oracle,
        functionArgs
      );

      const dataByKey = await accountDataByKey(
        "VOTE_HEIGHT_START_" + identifier,
        address(accounts.eggStaking)
      );

      expect(dataByKey).to.eql({
        key: "VOTE_HEIGHT_START_" + identifier,
        type: "integer",
        value: txResponse.height,
      });

      const functionArgsVote = [
        {
          type: "boolean",
          value: true,
        },
        {
          type: "integer",
          value: 0,
        },
      ];
      const invokeVote = dappUtils.buildInvokeScript(
        accounts.eggStaking,
        "voteYesOrNo",
        accounts.userSeed,
        functionArgsVote
      );
      const txResponseVote = await dappUtils.broadcastAndWaitForResponse(
        invokeVote
      );

      dappUtils.verifyTxResponse(
        txResponseVote,
        accounts.eggStaking,
        "voteYesOrNo",
        accounts.userSeed,
        functionArgsVote
      );

      //TODO: check correct keys are create
      //TODO: Create second user, check if global variables are updated
      //TODO: Make second user have a multiplier, check if math is correct
      //TODO: check if locktimes are correct
      //TODO: check vote results
    });
  });
});
