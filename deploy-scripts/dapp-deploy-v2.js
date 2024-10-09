const dappSeeds = require('../seeds.json');
const fs = require('fs');
const path = require('path');
const jsonFilePath = path.join(__dirname, '../seeds.json');
const transferFundsToWallets = require('./dapp-deploy-functions/transferFunds');
const deployTestEnv = require('./dapp-deploy-functions/deployTestEnv');
const setDappScripts = require('./dapp-deploy-functions/setDapps');
const configureOracle = require('./dapp-deploy-functions/configureOracle');

async function deployAllDapps() {
    for (const [dappKey, { seed, path, address, shouldDeploy }] of Object.entries(dappSeeds)) {

        if (shouldDeploy && dappKey !== 'ORACLE_SEED') {
            await deployDapp(dappKey, path, seed, address);
        }

    }
    console.log('All data deployed. See on json file what seeds have their address writed to know what dapps are deployed.');
}

async function deployDapp(dappKey, filePath, dappSeed, dappAddress) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
        if (!jsonData[dappKey]) {
            throw new Error(`Key ${dappKey} not found in JSON`);
        }
        if (dappAddress) return;

        await transferFundsToWallets(dappSeed, dappKey);
        await deployTestEnv(dappSeed, dappKey);
        await setDappScripts(filePath, dappSeed, dappKey)
        await configureOracle(dappSeed, dappKey, dappSeeds.ORACLE_SEED.seed)

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

deployAllDapps();
