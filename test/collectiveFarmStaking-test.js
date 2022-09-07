const DappUtils = require("./utils/dapp.utils");
const AccountUtils = require("./utils/account.utils");

const dappUtils = new DappUtils();
const accountUtils = new AccountUtils();
const DEFAULT_AMOUNT_OF_SHARE_ASSET = 10_000_000;
const AMOUNT_OF_SHARE_ASSET_FOR_STAKING = 10_000_000;
const TOTAL_AMOUNT_OF_SHARE_ASSET = DEFAULT_AMOUNT_OF_SHARE_ASSET + AMOUNT_OF_SHARE_ASSET_FOR_STAKING
const AMOUNT_OF_EGG_REQUIRED = 100_000_000; // More than actually required.
const VOTE_DURATION_IN_BLOCKS = 2;
const WAVES_ASSET_ID = "WAVES";

describe("ducks - collective farms - collectiveFarmStaking - complete flow", () => {
    before(async () => {
        // Setup required accounts, assets and dApps.
        // Provide a rough required amount of Waves for each account in order to be able to pay.
        const accountRecords = {
            oracle: 1.5,
            collectiveFarm: 0.1,
            collectiveFarmStaking: 0.1,
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

        // Setup required data for correct workings of the smart contracts.
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
                    // Required for the 'coupons' smart contract to work.
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
                    // Required for the 'coupons' smart contract to work.
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
                    // Required for the 'coupons' smart contract to work.
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
            dappUtils.broadcastAndWaitForResponse(oracleDataTx),
            dappUtils.broadcastAndWaitForResponse(masterSeedDataTx),
            dappUtils.broadcastAndWaitForResponse(couponsDataTx)
        ]);

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

        // Setup 'collectiveFarm' contract master key and farm.
        const functionArgsInitMasterKey = [
            {
                type: "string",
                value: publicKey(accounts.collectiveFarmMasterSeed)
            }
        ];
        const invokeInitMasterKey = dappUtils.buildInvokeScript(accounts.collectiveFarm, "initMasterKey", accounts.collectiveFarm, functionArgsInitMasterKey, 400_000);

        await dappUtils.broadcastAndWaitForResponse(invokeInitMasterKey);

        const functionArgsInitCollectiveFarm = dappUtils.generateCollectiveFarmInitData();
        const paymentObjectsInitCollectiveFarm = [
            {
                assetId: dappUtils.eggAssetId,
                amount: 10_000_000,
            }
        ];
        const invokeInitCollectiveFarm = dappUtils.buildInvokeScript(accounts.collectiveFarm, "initCollectiveFarm", accounts.collectiveFarmMasterSeed,
            functionArgsInitCollectiveFarm, 100_000_000, paymentObjectsInitCollectiveFarm);

        await dappUtils.broadcastAndWaitForResponse(invokeInitCollectiveFarm);

        // Provide liquidity to the collective farm.
        // Farm gives shared tokens in return for egg.
        const paymentObjectsProvideLiquidity = [{
            assetId: dappUtils.eggAssetId,
            amount: AMOUNT_OF_SHARE_ASSET_FOR_STAKING,
        }];
        const invokeProvideLiquidity = dappUtils.buildInvokeScript(accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjectsProvideLiquidity);

        await dappUtils.broadcastAndWaitForResponse(invokeProvideLiquidity);
    });

    describe("initiateDapp - setup dapp", () => {
        it("should not set the address and not initiate when using a different address", async () => {
            const functionArgs = [
                {
                    type: "string",
                    value: address(accounts.collectiveFarm)
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CID: Can be called only by the dapp-account";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should set the address and initiate", async () => {
            const functionArgs = [
                {
                    type: "string",
                    value: address(accounts.collectiveFarm)
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);

            const dataByKey = await accountDataByKey("CF_ADDRESS", address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey("global_lastCheck_interest", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'CF_ADDRESS',
                type: 'string',
                value: address(accounts.collectiveFarm)
            });
            expect(dataByKey2).to.eql({
                key: 'global_lastCheck_interest',
                type: 'integer',
                value: 1
            });
        });
    });

    describe("voteToLiquidate - before voting period - before staking", () => {
        it("should not be able to vote before staking assets", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CVTL: Please stake some tokens before you can vote!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("stakeFarmTokens - before voting period", () => {
        it("should not stake farm tokens when too many payments are added", async () => {
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
                    amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2),
                },
                {
                    assetId: WAVES_ASSET_ID,
                    amount: 1,
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
            const errorMessage = "CSFT: Too many payments added";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should not stake farm tokens when payment asset is wrong", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];
            const paymentObjects = [
                {
                    assetId: WAVES_ASSET_ID,
                    amount: 1,
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
            const errorMessage = "CSFT: Wrong assetId";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

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
                    amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2),
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);

            const dataByKey = await accountDataByKey("global_staked", address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey(address(accounts.collectiveFarmMasterSeed) + "_farm_staked", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'global_staked',
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
            });
            expect(dataByKey2).to.eql({
                key: address(accounts.collectiveFarmMasterSeed) + "_farm_staked",
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
            });
        });
    });

    describe("topUpReward", () => {
        it("should not add assets to the farm if wrong asset is provided", async () => {
            const paymentObjects = [
                {
                    assetId: WAVES_ASSET_ID,
                    amount: 1
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
            const errorMessage = "CTUP: Wrong assetId, payment should be EGG";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should add assets to the farm", async () => {
            const paymentObjects = [
                {
                    assetId: dappUtils.eggAssetId,
                    amount: 1_000_000
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        });
    });

    describe("claimReward", () => {
        it("should not claim farm staking rewards when sending a wrong payment", async () => {
            const invoke = dappUtils.buildInvokeScriptWithWrongPaymentObjects(accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
            const errorMessage = "CCR: Please don't add payments";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should claim farm staking rewards", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
        });
    });

    describe("claimRefundStaked & claimRefundUnstaked - before liquidation", () => {
        before(async () => {
            // Configure the oracle for the coupons smart contract, this is needed for the refund functionality.
            const functionArgs = [
                {
                    type: "string",
                    value: address(accounts.oracle)
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.coupons, "configureOracle", accounts.coupons, functionArgs);
            await dappUtils.broadcastAndWaitForResponse(invoke);
        });

        describe("claimRefundStaked", () => {
            it("should not refund staked assets when farm is not liquidated", async () => {
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);
                const errorMessage = "CCRS: cf not liquidated";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });
        });

        describe("claimRefundUnstaked", () => {
            it("should not refund unstaked assets when farm is not liquidated", async () => {
                const SHARE_ASSET_ID = (await accountDataByKey("SHARE_ASSET_ID", address(accounts.collectiveFarm)))["value"];
                const paymentObjects = [
                    {
                        assetId: SHARE_ASSET_ID,
                        amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundUnstaked", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
                const errorMessage = "CCRU: cf not liquidated";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });
        });
    });

    describe("voteToLiquidate - before voting period", () => {
        it("should not be able to vote before the voting period", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CVTL: Voting is finished, please finalize the vote!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("startVote - failed run", () => {
        it("should not start a vote if wrong function arguments are provided", async () => {
            const invoke = dappUtils.buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
            const errorMessage = "function 'startVote takes 0 args but 1 were(was) given";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should not start a vote if the invocation is not sent by the master seed account", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.oracle);
            const errorMessage = "CSV: Only the admin can start a liquidation vote for now!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should start a vote", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);

            const dataByKey = await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'VOTE_HEIGHT_START',
                type: 'integer',
                value: txResponse["height"]
            });
        });

        it("should not start a vote if one is already active", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
            const errorMessage = "CSV: There is already a vote running!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("voteToLiquidate - during voting period", () => {
        it("should add a vote", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        });

        it("should not be able to change a vote", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: true
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CVTL: You can not change your vote!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("stakeFarmTokens - during voting period", () => {
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
                    amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2),
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);

            let voteHeight = (await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking)))["value"];
            const dataByKey = await accountDataByKey("global_staked", address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey(address(accounts.collectiveFarmMasterSeed) + "_farm_staked", address(accounts.collectiveFarmStaking));
            const dataByKey3 = await accountDataByKey("VOTE_" + address(accounts.collectiveFarmMasterSeed) + "_" + voteHeight, address(accounts.collectiveFarmStaking));
            const dataByKey4 = await accountDataByKey("VOTE_TOTAL_" + false + "_" + voteHeight, address(accounts.collectiveFarmStaking));
            const dataByKey5 = await accountDataByKey("VOTE_TOTAL_" + voteHeight, address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'global_staked',
                type: 'integer',
                value: AMOUNT_OF_SHARE_ASSET_FOR_STAKING
            });
            expect(dataByKey2).to.eql({
                key: address(accounts.collectiveFarmMasterSeed) + "_farm_staked",
                type: 'integer',
                value: AMOUNT_OF_SHARE_ASSET_FOR_STAKING
            });
            expect(dataByKey3).to.eql({
                key: "VOTE_" + address(accounts.collectiveFarmMasterSeed) + "_" + voteHeight,
                type: 'string',
                value: 'false'
            });
            expect(dataByKey4).to.eql({
                key: "VOTE_TOTAL_" + false + "_" + voteHeight,
                type: 'integer',
                value: AMOUNT_OF_SHARE_ASSET_FOR_STAKING
            });
            expect(dataByKey5).to.eql({
                key: "VOTE_TOTAL_" + voteHeight,
                type: 'integer',
                value: AMOUNT_OF_SHARE_ASSET_FOR_STAKING
            });
        });
    });

    describe("finalizeVote - during voting period", () => {
        it("should not finish the voting if the voting period is not finished", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
            const errorMessage = "CFV: Voting is not finished!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("finalizeVote - failed liquidation", () => {
        before(async () => {
            await waitNBlocks(VOTE_DURATION_IN_BLOCKS);
        });

        it("should not finish the voting if wrong function arguments are provided", async () => {
            const invoke = dappUtils.buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
            const errorMessage = "function 'finalizeVote takes 0 args but 1 were(was) given";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should finish the voting", async () => {
            // VOTE_HEIGHT_START gets reset after unsuccessful vote, so need to get the height data before broadcast.
            const voteHeight = (await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking)))["value"];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);

            const dataByKey = await accountDataByKey("QUORUM_" + voteHeight, address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey("LIQUIDATED_" + voteHeight, address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: "QUORUM_" + voteHeight,
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / TOTAL_AMOUNT_OF_SHARE_ASSET) * 100
            });
            expect(dataByKey2).to.eql({
                key: "LIQUIDATED_" + voteHeight,
                type: 'boolean',
                value: false
            });
        });
    });

    describe("voteToLiquidate - after voting period", () => {
        before(async () => {
            // Make sure to wait until 1 block after voting has passed
            await waitNBlocks(1);
        });

        it("should not be able to vote after the voting period is finished", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CVTL: Voting is finished, please finalize the vote!";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });
    });

    describe("startVote - successful run", () => {
        it("should start a vote", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "startVote", accounts.collectiveFarmMasterSeed);

            const dataByKey = await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'VOTE_HEIGHT_START',
                type: 'integer',
                value: txResponse["height"]
            });
        });
    });

    describe("voteToLiquidate - during voting period", () => {
        it("should add a vote", async () => {
            const functionArgs = [
                {
                    type: "boolean",
                    value: true
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "voteToLiquidate", accounts.collectiveFarmMasterSeed, functionArgs);
        });
    });

    describe("withdrawFarmTokens - during voting period", () => {
        it("should not withdraw farm tokens if they are not available", async () => {
            const functionArgs = [
                {
                    type: "integer",
                    value: TOTAL_AMOUNT_OF_SHARE_ASSET
                },
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);
            const errorMessage = "CWFT: you don't have tokens available";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should withdraw farm tokens", async () => {
            const functionArgs = [
                {
                    type: "integer",
                    value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
                },
                {
                    type: "boolean",
                    value: false
                }
            ];
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);

            const dataByKey = await accountDataByKey("global_staked", address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey(address(accounts.collectiveFarmMasterSeed) + "_farm_staked", address(accounts.collectiveFarmStaking));
            const dataByKey3 = await accountDataByKey("last_staking_wd", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: 'global_staked',
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
            });
            expect(dataByKey2).to.eql({
                key: address(accounts.collectiveFarmMasterSeed) + "_farm_staked",
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
            });
            expect(dataByKey3).to.eql({
                key: 'last_staking_wd',
                type: 'integer',
                value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
            });
        });
    });

    describe("finalizeVote - successful liquidation", () => {
        before(async () => {
            await waitNBlocks(VOTE_DURATION_IN_BLOCKS);
        });

        it("should finish the voting", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "finalizeVote", accounts.collectiveFarmMasterSeed);

            const voteHeight = (await accountDataByKey("VOTE_HEIGHT_START", address(accounts.collectiveFarmStaking)))["value"];
            const dataByKey = await accountDataByKey("QUORUM_" + voteHeight, address(accounts.collectiveFarmStaking));
            const dataByKey2 = await accountDataByKey("LIQUIDATED_" + voteHeight, address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: "QUORUM_" + voteHeight,
                type: 'integer',
                value: ((AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2) / TOTAL_AMOUNT_OF_SHARE_ASSET) * 100
            });
            expect(dataByKey2).to.eql({
                key: "LIQUIDATED_" + voteHeight,
                type: 'boolean',
                value: true
            });
        });
    });

    before(async () => {
        // Configure the oracle for the coupons smart contract, this is needed for the refund functionality.
        const functionArgs = [
            {
                type: "string",
                value: address(accounts.oracle)
            }
        ];

        const invoke = dappUtils.buildInvokeScript(accounts.coupons, "configureOracle", accounts.coupons, functionArgs);
        await dappUtils.broadcastAndWaitForResponse(invoke);
    });

    describe("claimRefundStaked - after liquidation", () => {
        it("should not refund staked assets if wrong function arguments are provided", async () => {
            const invoke = dappUtils.buildInvokeScriptWithWrongFunctionArgs(accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);
            const errorMessage = "function 'claimRefundStaked takes 0 args but 1 were(was) given";

            await dappUtils.broadcastAndRejected(invoke, errorMessage);
        });

        it("should refund staked assets", async () => {
            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimRefundStaked", accounts.collectiveFarmMasterSeed);

            const dataByKey = await accountDataByKey(address(accounts.collectiveFarmMasterSeed) + "_farm_staked", address(accounts.collectiveFarmStaking));

            expect(dataByKey).to.eql({
                key: address(accounts.collectiveFarmMasterSeed) + "_farm_staked",
                type: 'integer',
                value: 0
            });
        });
    });

    describe("claimRefundUnstaked - after liquidation", () => {
        it("should refund unstaked assets", async () => {
            const SHARE_ASSET_ID = (await accountDataByKey("SHARE_ASSET_ID", address(accounts.collectiveFarm)))["value"];
            const paymentObjects = [
                {
                    assetId: SHARE_ASSET_ID,
                    amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
                }
            ];

            const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimRefundUnstaked", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
            const txResponse = await dappUtils.broadcastAndWaitForResponse(invoke);

            dappUtils.verifyTxResponse(txResponse, accounts.collectiveFarmStaking, "claimRefundUnstaked", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
        });
    });

    describe("general functionality - after liquidation", () => {
        describe("collectiveFarmStaking", () => {
            it("should not set the address and not initiate if the farm is already liquidated", async () => {
                const functionArgs = [
                    {
                        type: "string",
                        value: address(accounts.collectiveFarm)
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "initiateDapp", accounts.collectiveFarmStaking, functionArgs);
                const errorMessage = "CID: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not add assets to the farm if the farm is liquidated", async () => {
                const paymentObjects = [
                    {
                        assetId: dappUtils.eggAssetId,
                        amount: 1_000_000
                    }
                ];

                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "topUpReward", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
                const errorMessage = "CTUR: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not stake farm tokens if the farm is liquidated", async () => {
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
                        amount: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2),
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "stakeFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs, undefined, paymentObjects);
                const errorMessage = "CSFT: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not withdraw farm tokens if the farm is liquidated", async () => {
                const functionArgs = [
                    {
                        type: "integer",
                        value: (AMOUNT_OF_SHARE_ASSET_FOR_STAKING / 2)
                    },
                    {
                        type: "boolean",
                        value: false
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "withdrawFarmTokens", accounts.collectiveFarmMasterSeed, functionArgs);
                const errorMessage = "CTUR: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not claim farm staking rewards if the farm is liquidated", async () => {
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarmStaking, "claimReward", accounts.collectiveFarmMasterSeed);
                const errorMessage = "CCR: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });
        });

        describe("collectiveFarm", () => {
            it("should not provide liquidity to the farm if the farm is liquidated", async () => {
                const paymentObjects = [{
                    assetId: dappUtils.eggAssetId,
                    amount: 1_000_000,
                }];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "provideLiquidity", accounts.collectiveFarmMasterSeed, undefined, undefined, paymentObjects);
                const errorMessage = "CPL: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not be able to claim farming rewards if the farm is liquidated", async () => {
                const functionArgs = [
                    {
                        type: "string",
                        value: "random;ids;split;by;"
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "claimFarmingRewardProxy", accounts.collectiveFarmMasterSeed, functionArgs);
                const errorMessage = "CCFRP: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not be able to claim CEO fee if the farm is liquidated", async () => {
                const functionArgs = [
                    {
                        type: "string",
                        value: "address1"
                    },
                    {
                        type: "string",
                        value: "address2"
                    },
                    {
                        type: "integer",
                        value: 0
                    },
                    {
                        type: "integer",
                        value: 0
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "claimCeoFee", accounts.collectiveFarm, functionArgs, 400_000);
                const errorMessage = "CCCF: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });

            it("should not be able to unstake assets if the farm is liquidated", async () => {
                const functionArgs = [
                    {
                        type: "string",
                        value: "unstakeNFT"
                    },
                    {
                        type: "string",
                        value: "assetId"
                    }
                ];
                const invoke = dappUtils.buildInvokeScript(accounts.collectiveFarm, "callUnstakeProxy", accounts.collectiveFarm, functionArgs, 400_000);
                const errorMessage = "CCUP: CF is liquidated!";

                await dappUtils.broadcastAndRejected(invoke, errorMessage);
            });
        });
    });
});
