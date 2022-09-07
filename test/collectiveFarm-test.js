const DappUtils = require("./utils/dapp.utils");
const AccountUtils = require("./utils/account.utils");

const dappUtils = new DappUtils();
const accountUtils = new AccountUtils();
const AMOUNT_OF_EGG_REQUIRED = 100_000_000; // More than actually required.

describe("ducks - collective farms - collectiveFarm - complete flow", () => {
    before(async () => {
        // Provide a rough required amount of Waves for each account in order to be able to pay.
        const accountRecords = {
            oracle: 1.1,
            collectiveFarm: 0.1,
            // Collective farms use a master seed that can be used to track all transaction info etc.
            // example: https://wavesexplorer.com/addresses/3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF?search=3PDktsxDVEcoobpEBJcausnKo4enhcWUDEF
            // NOTE: This account also gets used as a user account in the tests.
            collectiveFarmMasterSeed: 1.1
        }

        await accountUtils.defineAccounts(accountRecords); // Preserved variable 'accounts' contains all defined accounts.
        await dappUtils.issueTestAsset(accounts.oracle);
        await dappUtils.setupDapp(accounts.collectiveFarm);

        // Setup required data for correct workings of the smart contracts.
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
                ],
            },
            accounts.collectiveFarmMasterSeed
        );

        await dappUtils.broadcastAndWaitForResponse(masterSeedDataTx);

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

        await dappUtils.broadcastAndWaitForResponse(transferTx);
    });

    describe("initMasterKey", () => {
        it("should initialize the master key", async () => {
            const functionArgs = [
                {
                    type: "string",
                    value: publicKey(accounts.collectiveFarmMasterSeed)
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgs, 400_000);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgs, 400_000);
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
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "initCollectiveFarm", accounts.collectiveFarmMasterSeed, functionArgs, 100_000_000, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "initCollectiveFarm", accounts.collectiveFarmMasterSeed, functionArgs, 100_000_000, paymentObjects);
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
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
        });

        it("should set value to false", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "setLock", accounts.collectiveFarmMasterSeed, functionArgs);
        });
    });

    describe("lockInvestments", () => {
        it("should lock the investments", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "lockInvestments", accounts.collectiveFarm, undefined, 400_000);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "lockInvestments", accounts.collectiveFarm, undefined, 400_000);
        });
    });

    describe("unlockInvestments", () => {
        it("should unlock the investments", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "unlockInvestments", accounts.collectiveFarm, undefined, 400_000);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "unlockInvestments", accounts.collectiveFarm, undefined, 400_000);
        });
    });

    describe("provideLiquidity", () => {
        it("should provide liquidity to the farm", async () => {
            const paymentObjects = [{
                assetId: dappUtils.eggAssetId,
                amount: 1_000_000,
            }];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        });
    });

    // TODO: expand tests to cover all functionality in the 'collectiveFarm' contract
    // describe("", () => {
    //   it("", async () => {

    //   });
    // });
});
