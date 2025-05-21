const seeds = require('../seeds.json');
require('dotenv').config();
const senderSeed = process.env.SENDER;

async function deployData() {
    const ducklings = seeds.BABY_DUCKS_SEED;
    try {
        const response = await fetch(`https://staging.wavesducks.com/api/v2/addresses/${address(senderSeed)}/ducklings?size=2000`);
        const ducklingsData = await response.json().data.filter(duckling => (duckling.feedNeeded - (duckling.level * 1e14)) <= 0);

        for (const item of ducklingsData) {

            const tx = invokeScript({
                version: 1,
                dApp: ducklings.address,
                aditionalFee: 400000,
                call: {
                    function: "turnDucklingIntoDuck",
                    args: []
                },
                payment: [
                    {
                        amount: 1,
                        assetId: item.assetId
                    },
                    {
                        amount: 1,
                        assetId: null
                    }
                ],
                chainId: 84,

            }, senderSeed);

            await broadcast(tx);
            await waitForTx(tx.id);
            console.log(`Ducking has been turned into Duck. `)
        }
    } catch (e) {
        console.error(`DEPLOY DATA ERROR.`);
        console.error(e.message);
        throw e;
    }
};

deployData();