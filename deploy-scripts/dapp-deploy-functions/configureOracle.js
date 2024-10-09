async function configureOracle(dappSeed, dappKey, oracleSeed) {
    if (dappKey === 'ORACLE_SEED') return;
    try {
        const dApp = address(dappSeed);

        const args = [{
            type: "string",
            value: address(oracleSeed),
        }]

        const houseKey = getHousesType(dappKey);
        if (houseKey) {
            args.push({ type: "string", value: houseKey })
        }

        const tx = invokeScript({
            version: 1,
            dApp,
            additionalFee: 400000,
            call: {
                function: "configureOracle",
                args,
            },
            payment: null,
        }, dappSeed);

        await broadcast(tx);
        await waitForTx(tx.id);
    } catch (e) {
        console.error(`CONFIGURE ORACLE ERROR. [${dappKey}: ${address(dappSeed)}]`);
        console.error(e.message);
        throw e;
    }
};

const getHousesType = (dappKey) => {
    if (dappKey === 'MEGA_DUCKS_HOUSE_SEED')
        return 'ART-BIGHOUSE';

    if (dappKey === 'DUCKS_HOUSE_SEED')
        return 'ART-HOUSE';

    if (dappKey === 'XMAS_STBLE_SEED')
        return 'ART-XMAS_STBLE'

    return undefined
}

module.exports = configureOracle;