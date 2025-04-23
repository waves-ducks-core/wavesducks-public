const seeds = require('../../seeds.json');

async function deployData() {
    const mFarming = seeds.MUTANT_FARMING_SEED;
    try {
        const response = await fetch(`https://testnet.node.blackturtle.eu/addresses/data/${mFarming.address}`);
        const json = await response.json();
        const responseData = json.filter(item => item.value < 0);

        for (const item of responseData) {
            const ssTxSetEnv = data({
                type: 12,
                version: 2,
                data: [


                    {
                        "key": item.key,
                        "value": null
                    }


                ],
                fee: 700000,
                feeAssetId: "WAVES"
            }, mFarming.seed);

            await broadcast(ssTxSetEnv);
            await waitForTx(ssTxSetEnv.id);
            console.log(`Key deployed `)
        }
    } catch (e) {
        console.error(`DEPLOY DATA ERROR.`);
        console.error(e.message);
        throw e;
    }
};

deployData();