const dappSeeds = require('../seeds.json');
const assets = require('../assets.json');
require('dotenv').config();

const { VEGG_FARMING_SEED, DUCKS_FARMING_SEED, EAGLES_FARMING_SEED,
    FELINES_FARMING_SEED, CANINES_FARMING_SEED, TURTLES_FARMING_SEED, COUPONS_SEED } = dappSeeds;
const { EGG_ASSETID, PETE_ASSETID, PUZZLE_ASSETID, SPICE_ASSETID, VEGG_ASSETID, WAVES_ASSETID } = assets
const senderSeed = process.env.SENDER;

const allFarmingAddress = [
    VEGG_FARMING_SEED.address,
    DUCKS_FARMING_SEED.address,
    EAGLES_FARMING_SEED.address,
    FELINES_FARMING_SEED.address,
    CANINES_FARMING_SEED.address,
    TURTLES_FARMING_SEED.address
];

function getAssetId(address) {
    const paymentAssetId = {
        [DUCKS_FARMING_SEED.address]: EGG_ASSETID,
        [VEGG_FARMING_SEED.address]: VEGG_ASSETID,
        [TURTLES_FARMING_SEED.address]: SPICE_ASSETID,
        [CANINES_FARMING_SEED.address]: WAVES_ASSETID,
        [FELINES_FARMING_SEED.address]: PETE_ASSETID,
        [EAGLES_FARMING_SEED.address]: PUZZLE_ASSETID,
    }

    return paymentAssetId[address];
}

async function topUpAllFarmingAddress() {
    for (const dapp of allFarmingAddress) {
        try {
            const tx = invokeScript({
                version: 1,
                dApp: dapp,
                aditionalFee: 400000,
                call: {
                    function: "topUpReward",
                    args: []
                },
                payment: [
                    {
                        amount: 10e8,
                        assetId: getAssetId(dapp)
                    }
                ],
                chainId: 84,

            }, dapp === VEGG_FARMING_SEED.address ? COUPONS_SEED.seed : senderSeed);

            await broadcast(tx);
            await waitForTx(tx.id);
            console.log(`TopUp successful for dapp: ${dapp}`);
        } catch (e) {
            console.error(`TopUp failed for dapp: ${dapp}`);
            console.error(e.message, '\n\n');
        }
    }
}

topUpAllFarmingAddress();