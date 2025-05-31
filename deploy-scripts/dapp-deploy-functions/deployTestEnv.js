
async function deployTestEnv(dappSeed, dappKey){
    try {
        const testEnv = require('../../jsonData/testEnv.json');
        const ssTxSetEnv = data({
            additionalFee: 400000,
            data: testEnv.data
        }, dappSeed);

        await broadcast(ssTxSetEnv);
        await waitForTx(ssTxSetEnv.id);
    } catch (e) {
        console.error(`DEPLOY TEST ENV ERROR. [${dappKey}: ${address(dappSeed)}]`);
        console.error(e.message);
        throw e;
    }
};

module.exports = deployTestEnv;