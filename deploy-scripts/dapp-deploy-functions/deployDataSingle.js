const seeds = require('../../seeds.json');

async function deployData() {
    const mFarming = seeds.COUPONS_SEED;
    try {
        const response = await fetch(`https://testnet.node.blackturtle.eu/addresses/data/${mFarming.address}`);
        const json = await response.json();
        const responseData = json.filter(item => item.key.startsWith('TASK_VEGG500000') || item.key.startsWith('TASK_VEGG500000'));

        const dataArray = responseData.map(item => ({
            key: item.key,
            value: null
        }));

        const ssTxSetEnv = data({
            type: 12,
            version: 2,
            data: dataArray,
            fee: 700000,
            feeAssetId: "WAVES"
        }, mFarming.seed);

        await broadcast(ssTxSetEnv);
        await waitForTx(ssTxSetEnv.id);
        console.log(`Keys deployed`);
    } catch (e) {
        console.error(`DEPLOY DATA ERROR.`);
        console.error(e.message);
        throw e;
    }
};

deployData();