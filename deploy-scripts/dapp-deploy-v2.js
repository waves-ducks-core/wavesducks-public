(async () => {
    require('dotenv').config()
    const dappSeed = process.env.DUCK_INCUBATOR_SEED;
    const testEnv = require('../jsonData/testEnv.json');
    const ssTxSetEnv = data(
        {
            additionalFee: 400000,
            data: testEnv.data
        },
        dappSeed
    );

    await broadcast(ssTxSetEnv).catch((e) => {
        console.log(e);
        throw e;
    });
    await waitForTx(ssTxSetEnv.id).catch((e) => {
        console.log(e);
        throw e;
    });
    console.log(ssTxSetEnv.id);

    const script = compile(file(process.env.FILE.replace(/\_/g, '/') + ".ride"));

    const ssTx = setScript(
        {
            script, additionalFee: 400000,
        }, dappSeed
    ); await broadcast(ssTx).catch((e) => {
        console.log(e); throw e;
    }); await waitForTx(ssTx.id).catch((e) => {
        console.log(e); throw e;
    }); console.log(ssTx.id);

    const dApp = address(dappSeed);
    const tx = invokeScript({
        version: 1,
        dApp,
        additionalFee:400000,
        call: {
            function: "configureOracle",
            args: [
                {
                    type: "string",
                    value: address(process.env.ORACLE_SEED),
                }],
        },
        payment: null,
    },
        dappSeed);

    console.log(JSON.stringify(tx)); await broadcast(tx).catch((e) => {
        console.log(e); throw e;
    }); await waitForTx(tx.id).catch((e) => {
        console.log(e); throw e;
    });
})();