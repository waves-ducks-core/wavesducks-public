const dappSeeds = require('../seeds.json');
const fs = require('fs');
const path = require('path');
const senderSeed = "vendor suspect stand giraffe lucky expose shine network hood oppose impact slogan appear mean aerobic";

const jsonFilePath = path.join(__dirname, '../seeds.json');

async function deployAllDapps() {
    for (const [dappKey, { seed, path, address, shouldDeploy }] of Object.entries(dappSeeds)) {

        if(shouldDeploy){
            await deployDapp(dappKey, path, seed, address);
        }
    }
}

async function deployDapp(dappKey, filePath, dappSeed, dappAddress) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        if (!jsonData[dappKey]) {
            throw new Error(`Key ${dappKey} not found in JSON`);
        }
        if (dappAddress) {
            console.log(`${dappKey}: ${dappAddress} is already deployed`);
            return;
        }

        await transferFundsToWallets(dappSeed, dappKey);
        await deployTestEnv(dappSeed, dappKey);

        if (dappKey === 'ORACLE_SEED') {
            await deployDataOnOracle(dappSeed)
        }
        
        await setDappScripts(filePath, dappSeed, dappKey)
        await configureOracle(dappSeed, dappKey)

        jsonData[dappKey].address = address(dappSeed);
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        console.log(`Deployment successful, updated ${dappKey}: ${address(dappSeed)}`);
    } catch (e) {
        console.error('Deployment failed:', e.message);

        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        if (jsonData[dappKey]) {
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
        }
    }
}

const transferFundsToWallets = async (dappSeed, dappKey) => {
    try {
        const transferTx = transfer({
            amount: 5_000_0000,
            assetId: null,
            recipient: address(dappSeed),
        }, senderSeed);

        await broadcast(transferTx);
        await waitForTx(transferTx.id);

        console.log(`${dappKey}: ${transferTx.recipient}`)
    } catch (e) {
        console.error(`TRANSFER FUNDS ERROR. [${dappKey}: ${address(dappSeed)}]`);
        console.error(e.message);
        throw e;
    }
};

const deployTestEnv = async (dappSeed, dappKey) => {
    try {
        const testEnv = require('../jsonData/testEnv.json');
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

const deployDataOnOracle = async (dappSeed) => {
    try {
        const dappOracle = require(`../jsonData/oracle-dev.json`);
        const ssTxSetEnv = data({
            additionalFee: 400000,
            data: dappOracle.data
        }, dappSeed);

        await broadcast(ssTxSetEnv);
        await waitForTx(ssTxSetEnv.id);
    } catch (e) {
        console.error(`DEPLOY DATA ORACLE ERROR.`);
        console.error(e.message);
        throw e;
    }
};

const setDappScripts = async (filePath, dappSeed, dappKey) => {
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

const configureOracle = async (dappSeed, dappKey) => {
    try {
        const dApp = address(dappSeed);

        const args = [{
            type: "string",
            value: address(dappSeeds.ORACLE_SEED.seed),
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

deployAllDapps();
