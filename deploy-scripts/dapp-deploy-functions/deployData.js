async function deployData (dappSeed, paths){
    try {
        for (const filePath of paths) {
            const jsonData = require(`../../${filePath}.json`);
            const ssTxSetEnv = data({
                additionalFee: 400000,
                data: jsonData.data
            }, dappSeed);

            await broadcast(ssTxSetEnv);
            await waitForTx(ssTxSetEnv.id);
            console.log(`Deployed: ${filePath}.json `)
        }
    } catch (e) {
        console.error(`DEPLOY DATA ERROR.`);
        console.error(e.message);
        throw e;
    }
};

module.exports = deployData;

// Can be done for: ORACLE and ARTEFACTS