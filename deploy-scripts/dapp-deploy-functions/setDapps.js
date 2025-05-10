async function setDapps(filePath, dappSeed, dappKey) {
    try {
        const script = compile(file(filePath));

        const ssTx = setScript({
            script,
            additionalFee: 400000,
        }, dappSeed);

        await broadcast(ssTx);
        await waitForTx(ssTx.id);
    } catch (e) {
        console.error(`SET SCRIPTS ERROR. [${dappKey}: ${address(dappSeed)}]`);
        console.error(e.message);
        throw e;
    }
};

module.exports = setDapps;
